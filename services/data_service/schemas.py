
from pydantic import BaseModel, Field
from typing import Any


class ValidationRequest(BaseModel):
    # Características que necesita el modelo.
    data: dict[str, Any]

    # Etiqueta real opcional:
    # 0 = tráfico normal
    # 1 = tráfico malicioso
    real_label: int | None = Field(
        default=None,
        ge=0,
        le=1
    )


class BatchValidationRequest(BaseModel):
    data: list[dict[str, Any]]
