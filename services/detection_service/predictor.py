
import joblib
import pandas as pd
from pathlib import Path

# Ubicación principal de ProtecKey
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Modelo LightGBM utilizado por la aplicación
MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "modelo_proteckey_lightgbm.joblib"
)

# Cargar el modelo
modelo = joblib.load(MODEL_PATH)


def realizar_prediccion(datos: dict):
    """
    Clasifica un registro y devuelve su puntuación
    estimada de tráfico potencialmente malicioso.
    """

    entrada = pd.DataFrame([datos])

    # Predicción utilizando el umbral actual
    prediccion = modelo.predict(entrada)
    resultado = int(prediccion[0])

    # Puntuación estimada para la clase maliciosa
    probabilidades = modelo.predict_proba(entrada)
    probabilidad = float(probabilidades[0, 1])

    clasificacion = (
        "Normal"
        if resultado == 0
        else "Potencialmente malicioso"
    )

    return {
        "prediction": resultado,
        "classification": clasificacion,
        "malicious_probability": round(probabilidad, 4)
    }


def realizar_prediccion_lote(registros: list):
    """
    Clasifica varios registros y devuelve
    sus respectivas puntuaciones estimadas.
    """

    if not registros:
        raise ValueError(
            "La lista de registros está vacía."
        )

    entrada = pd.DataFrame(registros)

    # Predicciones y probabilidades de todo el lote
    predicciones = modelo.predict(entrada)
    probabilidades = modelo.predict_proba(entrada)[:, 1]

    resultados = []

    for indice, (prediccion, probabilidad) in enumerate(
        zip(predicciones, probabilidades)
    ):

        valor = int(prediccion)

        clasificacion = (
            "Normal"
            if valor == 0
            else "Potencialmente malicioso"
        )

        resultados.append({
            "index": indice,
            "prediction": valor,
            "classification": clasificacion,
            "malicious_probability": round(
                float(probabilidad), 4
            )
        })

    total = len(resultados)

    normales = sum(
        resultado["prediction"] == 0
        for resultado in resultados
    )

    maliciosos = total - normales

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
