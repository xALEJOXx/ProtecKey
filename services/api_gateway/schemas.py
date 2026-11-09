from pydantic import BaseModel
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    data: dict
    real_label: int | None = Field(default=None, ge=0, le=1)

class BatchAnalysisRequest(BaseModel):
    data: list[dict]
    labels: list[int] | None = None
    nombre_archivo: str | None = None