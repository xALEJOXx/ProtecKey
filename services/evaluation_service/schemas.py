from pydantic import BaseModel
from typing import List


# Representa un resultado individual
class EvaluationItem(BaseModel):
    real: int
    prediction: int


# Permite evaluar varios resultados juntos
class EvaluationRequest(BaseModel):
    results: List[EvaluationItem]