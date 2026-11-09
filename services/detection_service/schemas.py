from pydantic import BaseModel


class PredictionRequest(BaseModel):
    """
    Representa los datos que recibe
    el Detection Service.
    """

    data: dict

from pydantic import BaseModel


class PredictionRequest(BaseModel):
    data: dict


class BatchPredictionRequest(BaseModel):
    data: list[dict]