import joblib
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "modelo_proteckey.joblib"
)


def obtener_contrato_modelo():
    """
    Obtiene las características utilizadas por el modelo
    y las separa según el tipo de transformación aplicada.
    """

    pipeline = joblib.load(MODEL_PATH)

    preprocesador = pipeline.named_steps[
        "preprocesamiento"
    ]

    columnas_numericas = []
    columnas_categoricas = []

    for nombre, transformador, columnas in (
        preprocesador.transformers_
    ):

        if nombre == "numericas":
            columnas_numericas.extend(
                list(columnas)
            )

        elif nombre == "categoricas":
            columnas_categoricas.extend(
                list(columnas)
            )

    columnas_requeridas = (
        columnas_numericas
        + columnas_categoricas
    )

    return {
        "todas": columnas_requeridas,
        "numericas": columnas_numericas,
        "categoricas": columnas_categoricas
    }