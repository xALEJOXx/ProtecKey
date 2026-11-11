from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

from services.api_gateway.schemas import (
    AnalysisRequest,
    BatchAnalysisRequest
)
from services.database.batch_repository import (
    guardar_analisis_lote,
    obtener_analisis_lotes
)
from services.api_gateway.live_monitor import router as live_router

app = FastAPI(
    title="ProtecKey API",
    description=(
        "API principal de acceso al sistema ProtecKey."
    ),
    version="1.0.0"
)



# PermitirÃ¡ posteriormente la comunicaciÃ³n
# con el frontend React.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


DATA_SERVICE_URL = os.getenv(
    "DATA_SERVICE_URL",
    "http://127.0.0.1:8001"
)

EVALUATION_SERVICE_URL = os.getenv(
    "EVALUATION_SERVICE_URL",
    "http://127.0.0.1:8003"
)


@app.get("/")
def inicio():

    return {
        "sistema": "ProtecKey",
        "api": "activa",
        "version": "1.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }



@app.post("/api/analyze")
def analizar(request: AnalysisRequest):

    try:
        respuesta = requests.post(
            f"{DATA_SERVICE_URL}/data/analyze",
            json={
                "data": request.data,
                "real_label": request.real_label
            },
            timeout=15
        )

        respuesta.raise_for_status()

        return respuesta.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible comunicarse "
                f"con Data Service: {error}"
            )
        )



@app.get("/api/history")
def historial():

    try:

        respuesta = requests.get(
            f"{DATA_SERVICE_URL}/data/history",
            timeout=10
        )

        respuesta.raise_for_status()

        return respuesta.json()

    except requests.RequestException as error:

        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible consultar "
                f"el historial: {error}"
            )
        )


@app.get("/api/history/{analysis_id}")
def historial_por_id(analysis_id: int):

    try:

        respuesta = requests.get(
            (
                f"{DATA_SERVICE_URL}"
                f"/data/history/{analysis_id}"
            ),
            timeout=10
        )

        respuesta.raise_for_status()

        return respuesta.json()

    except requests.RequestException as error:

        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible consultar "
                f"el anÃ¡lisis: {error}"
            )
        )


@app.post("/api/analyze-batch")
def analizar_lote(request: BatchAnalysisRequest):

    # ==========================================
    # 1. COMPROBAR QUE EXISTAN REGISTROS
    # ==========================================

    if not request.data:
        raise HTTPException(
            status_code=400,
            detail="No se recibieron registros para analizar."
        )

    # ==========================================
    # 2. ENVIAR REGISTROS AL DATA SERVICE
    # ==========================================

    try:
        respuesta = requests.post(
            f"{DATA_SERVICE_URL}/data/analyze-batch",
            json={"data": request.data},
            timeout=60
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible comunicarse con "
                f"Data Service: {error}"
            )
        )

    # ==========================================
    # 3. COMPROBAR RESPUESTA DEL DATA SERVICE
    # ==========================================

    try:
        resultado_deteccion = respuesta.json()

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail=(
                "Data Service devolviÃ³ una respuesta "
                "que no es JSON vÃ¡lido."
            )
        )

    # Conservar los errores HTTP del Data Service.
    if respuesta.status_code != 200:
        raise HTTPException(
            status_code=respuesta.status_code,
            detail=resultado_deteccion.get(
                "detail",
                "Error al validar los registros."
            )
        )

    # Comprobar que el anÃ¡lisis terminÃ³ correctamente.
    if resultado_deteccion.get("status") != "success":
        raise HTTPException(
            status_code=502,
            detail=resultado_deteccion.get(
                "mensaje",
                "Data Service no pudo completar el anÃ¡lisis."
            )
        )

    deteccion = resultado_deteccion["detection"]

    respuesta_final = {
        "status": "success",
        "detection": deteccion,
        "evaluation": None,
        "database": None
    }

    # ==========================================
    # 4. VALIDAR ETIQUETAS REALES (OPCIONAL)
    # ==========================================

    evaluacion = None

    if request.labels is not None:

        predicciones = [
            registro["prediction"]
            for registro in deteccion["results"]
        ]

        if len(request.labels) != len(predicciones):
            raise HTTPException(
                status_code=400,
                detail=(
                    "La cantidad de labels no coincide "
                    "con la cantidad de registros."
                )
            )

        # ProtecKey utiliza clasificaciÃ³n binaria.
        # Solo se permiten etiquetas 0 y 1.
        if any(
            type(label) is not int or label not in (0, 1)
            for label in request.labels
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Las etiquetas reales deben contener "
                    "Ãºnicamente los valores 0 y 1."
                )
            )

        evaluaciones = [
            {
                "real": real,
                "prediction": prediccion
            }
            for real, prediccion in zip(
                request.labels,
                predicciones
            )
        ]

        # ==========================================
        # 5. SOLICITAR MÃ‰TRICAS DE EVALUACIÃ“N
        # ==========================================

        try:
            respuesta_evaluacion = requests.post(
                f"{EVALUATION_SERVICE_URL}/evaluation/metrics",
                json={"results": evaluaciones},
                timeout=30
            )

            respuesta_evaluacion.raise_for_status()

            evaluacion = respuesta_evaluacion.json()

            respuesta_final["evaluation"] = evaluacion

        except requests.RequestException as error:
            raise HTTPException(
                status_code=503,
                detail=(
                    "La detecciÃ³n se realizÃ³, pero "
                    "Evaluation Service no pudo responder: "
                    f"{error}"
                )
            )

    # ==========================================
    # 6. PREPARAR DATOS PARA POSTGRESQL
    # ==========================================

    datos_guardado = {
        "nombre_archivo": (
            request.nombre_archivo
            or "archivo_sin_nombre.csv"
        ),

        "total_registros": deteccion["total"],

        "normales": deteccion["normal"],

        "maliciosos": (
            deteccion["potentially_malicious"]
        ),

        "porcentaje_malicioso": (
            deteccion["malicious_percentage"]
        ),

        "tiene_etiquetas": (
            request.labels is not None
        )
    }

    # ==========================================
    # 7. AGREGAR MÃ‰TRICAS SI EXISTEN
    # ==========================================

    if evaluacion:

        matriz = evaluacion["confusion_matrix"]
        metricas = evaluacion["metrics"]

        datos_guardado.update({
            "tn": matriz["TN"],
            "fp": matriz["FP"],
            "fn": matriz["FN"],
            "tp": matriz["TP"],

            "accuracy": metricas["accuracy"],
            "precision": metricas["precision"],
            "recall": metricas["recall"],
            "f1": metricas["f1"],
            "fpr": metricas["fpr"],
            "fnr": metricas["fnr"]
        })

    # ==========================================
    # 8. GUARDAR RESULTADOS EN POSTGRESQL
    # ==========================================

    try:
        registro_bd = guardar_analisis_lote(
            **datos_guardado
        )

        respuesta_final["database"] = {
            "saved": True,
            "id": registro_bd["id"],
            "fecha_hora": (
                registro_bd["fecha_hora"].isoformat()
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "El anÃ¡lisis se realizÃ³ correctamente, "
                "pero no pudo guardarse en PostgreSQL: "
                f"{error}"
            )
        )

    # ==========================================
    # 9. DEVOLVER RESULTADO FINAL
    # ==========================================

    return respuesta_final


# ==========================================
# HISTORIAL DE ANÃLISIS POR LOTES
# ==========================================

@app.get("/api/batch-history")
def historial_lotes():

    try:
        registros = obtener_analisis_lotes()

        historial = []

        for registro in registros:

            registro_formateado = {}

            for clave, valor in registro.items():

                if hasattr(valor, "isoformat"):
                    registro_formateado[clave] = valor.isoformat()

                elif hasattr(valor, "as_tuple"):
                    registro_formateado[clave] = float(valor)

                else:
                    registro_formateado[clave] = valor

            historial.append(registro_formateado)

        return {
            "status": "success",
            "total": len(historial),
            "history": historial
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "No fue posible consultar el historial "
                f"de anÃ¡lisis por lotes: {error}"
            )
        )


# Registrar directamente las rutas HTTP y WebSocket
for ruta in live_router.routes:
    app.router.routes.append(ruta)


# ==========================================================
# PROTECKEY - HISTORIAL DE DETECCIONES AUTOMATICAS LIGHTGBM
# ==========================================================

import os as _ml_os
import secrets as _ml_secrets

from fastapi import Header as _MLHeader
from fastapi import HTTPException as _MLHTTPException
from fastapi import Query as _MLQuery
from pydantic import BaseModel as _MLBaseModel
from pydantic import Field as _MLField

from services.database.ml_repository import (
    guardar_prediccion_ml_db,
    obtener_historial_ml
)


class PrediccionMLRecibida(_MLBaseModel):
    protocolo: str
    origen: tuple[str, int]
    destino: tuple[str, int]
    prediccion: int = _MLField(ge=0, le=1)
    probabilidad_ataque: float = _MLField(ge=0, le=1)
    caracteristicas: dict = _MLField(default_factory=dict)
    estado_tcp_info: dict = _MLField(default_factory=dict)
    analisis_amenaza: dict = _MLField(default_factory=dict)
    experimental: bool = True


@app.post("/api/ml/predictions")
def registrar_prediccion_ml(
    resultado: PrediccionMLRecibida,
    x_monitor_token: str | None = _MLHeader(default=None)
):
    token_esperado = _ml_os.getenv("LIVE_MONITOR_TOKEN")

    if (
        not token_esperado
        or not x_monitor_token
        or not _ml_secrets.compare_digest(
            x_monitor_token,
            token_esperado
        )
    ):
        raise _MLHTTPException(
            status_code=401,
            detail="Acceso no autorizado."
        )

    try:
        registro = guardar_prediccion_ml_db(
            resultado.model_dump()
        )

        return {
            "status": "success",
            "registro": registro
        }

    except Exception:
        raise _MLHTTPException(
            status_code=503,
            detail="No fue posible guardar la prediccion."
        )


@app.get("/api/ml/history")
def consultar_historial_ml(
    limite: int = _MLQuery(default=20, ge=1, le=100),
    pagina: int = _MLQuery(default=1, ge=1),
    x_history_token: str | None = _MLHeader(default=None)
):
    token_esperado = _ml_os.getenv("LIVE_HISTORY_TOKEN")

    if (
        not token_esperado
        or not x_history_token
        or not _ml_secrets.compare_digest(
            x_history_token,
            token_esperado
        )
    ):
        raise _MLHTTPException(
            status_code=401,
            detail="Acceso no autorizado."
        )

    try:
        return obtener_historial_ml(
            limite=limite,
            pagina=pagina
        )

    except Exception:
        raise _MLHTTPException(
            status_code=503,
            detail="No fue posible consultar el historial ML."
        )


@app.get("/api/ml/predictions/{prediccion_id}")
def consultar_detalle_prediccion_ml(
    prediccion_id: int,
    x_history_token: str | None = _MLHeader(default=None)
):
    import os
    import secrets
    from fastapi import HTTPException
    from services.database.ml_repository import obtener_detalle_ml

    token_esperado = os.getenv("LIVE_HISTORY_TOKEN", "")

    if (
        not token_esperado
        or not x_history_token
        or not secrets.compare_digest(
            x_history_token,
            token_esperado
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="No autorizado"
        )

    if prediccion_id < 1:
        raise HTTPException(
            status_code=400,
            detail="ID invalido"
        )

    detalle = obtener_detalle_ml(prediccion_id)

    if detalle is None:
        raise HTTPException(
            status_code=404,
            detail="Prediccion no encontrada"
        )

    return detalle

@app.get("/api/ml/stats")
def consultar_estadisticas_ml(
    x_history_token: str | None = _MLHeader(default=None)
):
    from services.database.ml_repository import obtener_estadisticas_ml

    token_esperado = _ml_os.getenv("LIVE_HISTORY_TOKEN")

    if (
        not token_esperado
        or not x_history_token
        or not _ml_secrets.compare_digest(
            x_history_token,
            token_esperado
        )
    ):
        raise _MLHTTPException(
            status_code=401,
            detail="Acceso no autorizado."
        )

    try:
        return obtener_estadisticas_ml()
    except Exception:
        raise _MLHTTPException(
            status_code=503,
            detail="No fue posible consultar las estadisticas ML."
        )
