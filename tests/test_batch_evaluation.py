import pandas as pd
import requests


# ==========================================
# 1. CARGAR DATASET
# ==========================================

test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Crear la misma muestra controlada:
# 50 normales + 50 maliciosos
normales = test[
    test["label"] == 0
].head(50)

maliciosos = test[
    test["label"] == 1
].head(50)


muestra = pd.concat(
    [normales, maliciosos],
    ignore_index=True
)


# ==========================================
# 2. GUARDAR LABELS REALES
# ==========================================

labels_reales = (
    muestra["label"]
    .astype(int)
    .tolist()
)


# ==========================================
# 3. PREPARAR DATOS PARA LIGHTGBM
# ==========================================

datos_modelo = muestra.drop(
    columns=[
        "id",
        "attack_cat",
        "label"
    ]
)


registros = datos_modelo.to_dict(
    orient="records"
)


print("=" * 60)
print("EVALUACIÓN POR LOTE - PROTECKEY")
print("=" * 60)

print(
    "\nRegistros enviados:",
    len(registros)
)


# ==========================================
# 4. DATA SERVICE → DETECTION SERVICE
# ==========================================

respuesta = requests.post(
    (
        "http://127.0.0.1:8001"
        "/data/analyze-batch"
    ),
    json={
        "data": registros
    },
    timeout=60
)


resultado = respuesta.json()


if resultado.get("status") != "success":

    print("\nERROR EN DETECCIÓN:")
    print(resultado)

    raise SystemExit()


predicciones = [
    registro["prediction"]
    for registro
    in resultado["detection"]["results"]
]


print(
    "Predicciones obtenidas:",
    len(predicciones)
)


# ==========================================
# 5. PREPARAR EVALUACIÓN
# ==========================================

evaluaciones = []

for real, prediccion in zip(
    labels_reales,
    predicciones
):

    evaluaciones.append({
        "real": real,
        "prediction": prediccion
    })


# ==========================================
# 6. EVALUATION SERVICE
# ==========================================

respuesta_evaluacion = requests.post(
    (
        "http://127.0.0.1:8003"
        "/evaluation/metrics"
    ),
    json={
        "results": evaluaciones
    },
    timeout=30
)


print(
    "\nCódigo Evaluation Service:",
    respuesta_evaluacion.status_code
)


print("\nRESULTADO:")

print(
    respuesta_evaluacion.json()
)