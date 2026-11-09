from fastapi import FastAPI, HTTPException

import requests
from services.data_service.schemas import (
    ValidationRequest,
    BatchValidationRequest
)
from services.data_service.validator import validar_entrada
from services.data_service.model_contract import obtener_contrato_modelo
from services.database.analysis_repository import (
    guardar_analisis,
    obtener_historial,
    obtener_analisis_por_id
)
import os

DETECTION_SERVICE_URL = os.getenv(
    "DETECTION_SERVICE_URL",
    "http://127.0.0.1:8002"
)

# Creamos la aplicación FastAPI.
app = FastAPI(
    title="ProtecKey - Data Service",
    description="Servicio encargado de validar los datos recibidos por ProtecKey.",
    version="1.0.0"
)


# Obtenemos las características que necesita el modelo.
CONTRATO_MODELO = obtener_contrato_modelo()

COLUMNAS_MODELO = CONTRATO_MODELO["todas"]
COLUMNAS_NUMERICAS = CONTRATO_MODELO["numericas"]
COLUMNAS_CATEGORICAS = CONTRATO_MODELO["categoricas"]


@app.get("/")
def inicio():
    """
    Ruta principal.
    """

    return {
        "servicio": "Data Service",
        "estado": "activo"
    }


@app.get("/health")
def health():
    """
    Permite comprobar que el servicio funciona.
    """

    return {
        "status": "ok"
    }


@app.get("/data/features")
def obtener_features():

    return {
        "cantidad": len(COLUMNAS_MODELO),
        "numericas": COLUMNAS_NUMERICAS,
        "categoricas": COLUMNAS_CATEGORICAS
    }


@app.post("/data/validate")
def validar(request: ValidationRequest):

    resultado = validar_entrada(
        request.data,
        COLUMNAS_MODELO,
        COLUMNAS_NUMERICAS,
        COLUMNAS_CATEGORICAS
    )

    return resultado

@app.post("/data/analyze")
def analizar(request: ValidationRequest):

    # 1. Validar los datos recibidos
    validacion = validar_entrada(
        request.data,
        COLUMNAS_MODELO,
        COLUMNAS_NUMERICAS,
        COLUMNAS_CATEGORICAS
    )

    if not validacion["valido"]:
        return {
            "status": "error",
            "validation": validacion
        }

    # 2. Enviar los datos al Detection Service
    try:
        respuesta = requests.post(
            f"{DETECTION_SERVICE_URL}/detection/predict",
            json={"data": request.data},
            timeout=10
        )

        respuesta.raise_for_status()

        resultado_deteccion = respuesta.json()

    except requests.RequestException as error:
        return {
            "status": "error",
            "mensaje": (
                "No fue posible comunicarse "
                "con Detection Service."
            ),
            "detalle": str(error)
        }


    # 3. Calcular la evaluación individual, si existe etiqueta real.
    prediccion = int(resultado_deteccion["prediction"])
    etiqueta_real = request.real_label

    evaluacion = None

    if etiqueta_real is not None:

        if etiqueta_real == 1 and prediccion == 1:
            evaluacion = "TP"

        elif etiqueta_real == 0 and prediccion == 0:
            evaluacion = "TN"

        elif etiqueta_real == 0 and prediccion == 1:
            evaluacion = "FP"

        elif etiqueta_real == 1 and prediccion == 0:
            evaluacion = "FN"

    # 4. Guardar la predicción y su evaluación en PostgreSQL.
    try:
        registro = guardar_analisis(
            prediction=prediccion,
            classification=resultado_deteccion["classification"],
            real_label=etiqueta_real,
            evaluation=evaluacion
        )

    except Exception as error:
        return {
            "status": "error",
            "mensaje": (
                "La predicción fue realizada, "
                "pero no pudo almacenarse."
            ),
            "detalle": str(error)
        }

    # 5. Devolver resultado completo

    return {
        "status": "success",
        "validation": validacion,
        "detection": resultado_deteccion,
        "evaluation": {
            "real_label": etiqueta_real,
            "result": evaluacion,
            "evaluated": evaluacion is not None
        },
        "database": {
            "saved": True,
            "analysis_id": registro["id"],
            "fecha_hora": registro["fecha_hora"]
        }
    }


@app.get("/data/history")
def historial():

    try:
        registros = obtener_historial()

        return {
            "status": "success",
            "total": len(registros),
            "records": registros
        }

    except Exception as error:
        return {
            "status": "error",
            "mensaje": (
                "No fue posible consultar "
                "el historial."
            ),
            "detalle": str(error)
        }


@app.get("/data/history/{analysis_id}")
def historial_por_id(analysis_id: int):

    try:
        registro = obtener_analisis_por_id(
            analysis_id
        )

        if registro is None:
            return {
                "status": "error",
                "mensaje": (
                    "El análisis solicitado "
                    "no existe."
                )
            }

        return {
            "status": "success",
            "record": registro
        }

    except Exception as error:
        return {
            "status": "error",
            "mensaje": (
                "No fue posible consultar "
                "el análisis."
            ),
            "detalle": str(error)
        }

@app.post("/data/analyze-batch")
def analizar_lote(request: BatchValidationRequest):

    if not request.data:
        return {
            "status": "error",
            "mensaje": "No se recibieron registros."
        }

    # ==========================================
    # 1. VALIDAR TODOS LOS REGISTROS
    # ==========================================

    errores = []

    for indice, registro in enumerate(request.data):

        validacion = validar_entrada(
            registro,
            COLUMNAS_MODELO,
            COLUMNAS_NUMERICAS,
            COLUMNAS_CATEGORICAS
        )

        if not validacion["valido"]:
            errores.append({
                "index": indice,
                "errores": validacion["errores"],
                "faltantes": validacion["faltantes"]
            })

    if errores:
        raise HTTPException(
            status_code=422,
            detail={
                "mensaje": "Uno o más registros contienen errores.",
                "total_errores": len(errores),
                "errors": errores
            }
        )

    # ==========================================
    # 2. ENVIAR LOTE A DETECTION SERVICE
    # ==========================================

    try:
        respuesta = requests.post(
            f"{DETECTION_SERVICE_URL}/detection/predict-batch",
            json={
                "data": request.data
            },
            timeout=60
        )

        respuesta.raise_for_status()

        resultado = respuesta.json()

    except requests.RequestException as error:
        return {
            "status": "error",
            "mensaje": (
                "No fue posible comunicarse "
                "con Detection Service."
            ),
            "detalle": str(error)
        }

    # ==========================================
    # 3. DEVOLVER RESULTADO
    # ==========================================

    return {
        "status": "success",
        "validation": {
            "valid": True,
            "total_validated": len(request.data)
        },
        "detection": resultado
    }