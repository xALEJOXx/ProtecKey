
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# Obtener la carpeta principal del proyecto.
ROOT = Path(__file__).resolve().parents[1]

# Rutas del modelo y del conjunto de prueba.
MODEL_PATH = ROOT / "models" / "modelo_proteckey_lightgbm_nuevo.joblib"
DATA_PATH = ROOT / "data" / "UNSW_NB15_testing-set.csv"

# Cargar el modelo entrenado.
modelo = joblib.load(MODEL_PATH)

# Cargar los registros de prueba.
datos = pd.read_csv(DATA_PATH)

# Obtener las 42 características esperadas por el modelo.
preprocesador = modelo.named_steps["preprocesamiento"]
columnas = list(preprocesador.feature_names_in_)

# Verificar que todas las características estén disponibles.
faltantes = [col for col in columnas if col not in datos.columns]

if faltantes:
    raise ValueError(f"Faltan columnas: {faltantes}")

# Separar características y etiquetas reales.
X = datos[columnas]
y_real = datos["label"]

# Generar las predicciones.
print("Evaluando el modelo LightGBM...")
y_pred = modelo.predict(X)

# Calcular las métricas.
accuracy = accuracy_score(y_real, y_pred)
precision = precision_score(y_real, y_pred, zero_division=0)
recall = recall_score(y_real, y_pred, zero_division=0)
f1 = f1_score(y_real, y_pred, zero_division=0)

# Calcular la matriz de confusión.
matriz = confusion_matrix(y_real, y_pred, labels=[0, 1])
tn, fp, fn, tp = matriz.ravel()

# Mostrar resultados.
print("\n===== RESULTADOS DE PROTECKEY =====")
print(f"Registros evaluados: {len(datos)}")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-score:  {f1:.4f}")

print("\n===== MATRIZ DE CONFUSION =====")
print(f"TN - Normales correctos: {tn}")
print(f"FP - Falsas alarmas: {fp}")
print(f"FN - Amenazas no detectadas: {fn}")
print(f"TP - Amenazas detectadas: {tp}")

print("\n===== REPORTE DE CLASIFICACION =====")
print(classification_report(
    y_real,
    y_pred,
    target_names=["Normal", "Potencialmente malicioso"],
    zero_division=0,
))
