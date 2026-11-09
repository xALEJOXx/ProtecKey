import joblib
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "modelo_proteckey_lightgbm.joblib"
)

modelo = joblib.load(MODEL_PATH)


def realizar_prediccion(datos: dict):

    entrada = pd.DataFrame([datos])

    prediccion = modelo.predict(entrada)

    resultado = int(prediccion[0])

    if resultado == 0:
        clasificacion = "Normal"
    else:
        clasificacion = "Potencialmente malicioso"

    return {
        "prediction": resultado,
        "classification": clasificacion
    }

def realizar_prediccion_lote(registros: list):
    """
    Realiza la predicción de múltiples registros
    utilizando el pipeline LightGBM de ProtecKey.
    """

    if not registros:
        raise ValueError(
            "La lista de registros está vacía."
        )

    # Convertir todos los registros en un DataFrame
    entrada = pd.DataFrame(registros)

    # El pipeline procesa todas las filas de una vez
    predicciones = modelo.predict(entrada)

    resultados = []

    for indice, prediccion in enumerate(predicciones):

        valor = int(prediccion)

        if valor == 0:
            clasificacion = "Normal"
        else:
            clasificacion = "Potencialmente malicioso"

        resultados.append({
            "index": indice,
            "prediction": valor,
            "classification": clasificacion
        })

    total = len(resultados)

    normales = sum(
        resultado["prediction"] == 0
        for resultado in resultados
    )

    maliciosos = sum(
        resultado["prediction"] == 1
        for resultado in resultados
    )

    return {
        "total": total,
        "normal": normales,
        "potentially_malicious": maliciosos,
        "malicious_percentage": round(
            (maliciosos / total) * 100,
            2
        ),
        "results": resultados
    }