
from pathlib import Path

import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

# Ruta principal del proyecto
ROOT = Path(__file__).resolve().parents[1]

# Cargar solamente los datos de entrenamiento
datos = pd.read_csv(
    ROOT / "data" / "UNSW_NB15_training-set.csv"
)

# Separar características y etiquetas
X = datos.drop(columns=["id", "attack_cat", "label"])
y = datos["label"]

# División estratificada: 80 % entrenamiento, 20 % validación
X_train, X_val, y_train, y_val = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("===== DISTRIBUCION DE DATOS =====")
print(f"Entrenamiento: {len(X_train)} registros")
print(f"Validación: {len(X_val)} registros")

# Identificar características
categoricas = ["proto", "service", "state"]
numericas = [col for col in X.columns if col not in categoricas]

# Preprocesamiento
preprocesamiento = ColumnTransformer([
    ("numericas", StandardScaler(), numericas),
    (
        "categoricas",
        OneHotEncoder(handle_unknown="ignore"),
        categoricas
    )
])

# Modelo temporal con los mismos hiperparámetros
clasificador = LGBMClassifier(
    n_estimators=400,
    max_depth=10,
    min_child_samples=60,
    colsample_bytree=0.8,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
    verbosity=-1
)

pipeline = Pipeline([
    ("preprocesamiento", preprocesamiento),
    ("modelo", clasificador)
])

# Entrenar únicamente con el 80 %
print("\nEntrenando modelo temporal...")
pipeline.fit(X_train, y_train)

# Obtener probabilidades en el 20 % de validación
probabilidades = pipeline.predict_proba(X_val)[:, 1]

umbrales = [0.30, 0.40, 0.50, 0.55, 0.60, 0.65, 0.70]

resultados = []

for umbral in umbrales:
    predicciones = (probabilidades >= umbral).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_val, predicciones, labels=[0, 1]
    ).ravel()

    resultados.append({
        "Umbral": umbral,
        "Accuracy": round(
            accuracy_score(y_val, predicciones), 4
        ),
        "Precision": round(
            precision_score(y_val, predicciones, zero_division=0), 4
        ),
        "Recall": round(
            recall_score(y_val, predicciones, zero_division=0), 4
        ),
        "F1": round(
            f1_score(y_val, predicciones, zero_division=0), 4
        ),
        "Falsas alarmas": int(fp),
        "No detectadas": int(fn),
    })

tabla = pd.DataFrame(resultados)

print("\n===== RESULTADOS DE VALIDACION =====")
print(tabla.to_string(index=False))

# Mostrar el umbral con mejor F1 en validación
mejor = tabla.loc[tabla["F1"].idxmax()]

print("\n===== MEJOR UMBRAL SEGUN F1 =====")
print(f"Umbral: {mejor['Umbral']:.2f}")
print(f"F1: {mejor['F1']:.4f}")
print(f"Recall: {mejor['Recall']:.4f}")
print(f"Falsas alarmas: {int(mejor['Falsas alarmas'])}")
print(f"Amenazas no detectadas: {int(mejor['No detectadas'])}")
