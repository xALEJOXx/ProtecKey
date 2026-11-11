
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    """
    Datos recibidos para analizar un registro individual.
    """
    data: dict


class BatchPredictionRequest(BaseModel):
    """
    Datos recibidos para analizar varios registros.
    """
    data: list[dict]
