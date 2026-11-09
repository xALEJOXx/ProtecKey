from fastapi import FastAPI, HTTPException

from services.evaluation_service.schemas import (
    EvaluationRequest
)

from services.evaluation_service.metrics import (
    calcular_metricas
)


app = FastAPI(
    title="ProtecKey - Evaluation Service",
    description=(
        "Servicio encargado de evaluar las predicciones "
        "realizadas por ProtecKey."
    ),
    version="1.0.0"
)


@app.get("/")
def inicio():

    return {
        "servicio": "Evaluation Service",
        "estado": "activo"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }


@app.post("/evaluation/metrics")
def evaluar(request: EvaluationRequest):

    if len(request.results) == 0:
        raise HTTPException(
            status_code=400,
            detail="Se requiere al menos un resultado."
        )

    valores_reales = []
    predicciones = []

    for resultado in request.results:

        # Solo aceptamos clasificación binaria
        if resultado.real not in [0, 1]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Los valores reales deben ser 0 o 1."
                )
            )

        if resultado.prediction not in [0, 1]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Las predicciones deben ser 0 o 1."
                )
            )

        valores_reales.append(
            resultado.real
        )

        predicciones.append(
            resultado.prediction
        )

    resultado_metricas = calcular_metricas(
        valores_reales,
        predicciones
    )

    return {
        "status": "success",
        "total_records": len(request.results),
        **resultado_metricas
    }