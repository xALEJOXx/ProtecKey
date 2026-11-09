from fastapi import FastAPI, HTTPException

from services.detection_service.schemas import (
    PredictionRequest,
    BatchPredictionRequest
)

from services.detection_service.predictor import (
    realizar_prediccion,
    realizar_prediccion_lote
)


app = FastAPI(
    title="ProtecKey - Detection Service",
    description=(
        "Servicio encargado de clasificar registros "
        "como normales o potencialmente maliciosos."
    ),
    version="1.0.0"
)


@app.get("/")
def inicio():
    return {
        "servicio": "Detection Service",
        "estado": "activo"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.post("/detection/predict")
def predecir(request: PredictionRequest):
    """
    Ejecuta una predicción utilizando
    el modelo entrenado de ProtecKey.
    """

    try:

        resultado = realizar_prediccion(
            request.data
        )

        return {
            "status": "success",
            **resultado
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=f"No fue posible realizar la predicción: {error}"
        )

@app.post("/detection/predict-batch")
def predecir_lote(request: BatchPredictionRequest):

    try:

        resultado = realizar_prediccion_lote(
            request.data
        )

        return {
            "status": "success",
            **resultado
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=(
                "No fue posible realizar la "
                f"predicción por lote: {error}"
            )
        )