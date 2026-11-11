
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

ROOT = Path(__file__).resolve().parents[1]

modelo = joblib.load(
    ROOT / "models" / "modelo_proteckey_lightgbm_nuevo.joblib"
)

datos = pd.read_csv(
    ROOT / "data" / "UNSW_NB15_testing-set.csv"
)

# Utilizar las características esperadas por el modelo.
columnas = list(
    modelo.named_steps["preprocesamiento"].feature_names_in_
)

X = datos[columnas]
y_real = datos["label"]

# Obtener la probabilidad de la clase maliciosa.
probabilidades = modelo.predict_proba(X)[:, 1]

umbrales = [0.30, 0.50]

resultados = []

for umbral in umbrales:
    predicciones = (probabilidades >= umbral).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_real, predicciones, labels=[0, 1]
    ).ravel()

    resultados.append({
        "Umbral": umbral,
        "Accuracy": round(
            accuracy_score(y_real, predicciones), 4
        ),
        "Precision": round(
            precision_score(y_real, predicciones), 4
        ),
        "Recall": round(
            recall_score(y_real, predicciones), 4
        ),
        "F1": round(
            f1_score(y_real, predicciones), 4
        ),
        "Falsas alarmas": fp,
        "No detectadas": fn,
    })

tabla = pd.DataFrame(resultados)

print("\n===== COMPARACION DE UMBRALES =====")
print(tabla.to_string(index=False))
