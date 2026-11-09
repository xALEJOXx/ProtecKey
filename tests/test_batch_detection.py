import pandas as pd
import requests


# ==========================================
# CARGAR DATASET
# ==========================================

test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Tomamos 50 registros normales
normales = test[
    test["label"] == 0
].head(50)


# Tomamos 50 registros maliciosos
maliciosos = test[
    test["label"] == 1
].head(50)


# Unimos los 100 registros
muestra = pd.concat(
    [
        normales,
        maliciosos
    ],
    ignore_index=True
)


# Guardamos las etiquetas reales únicamente
# para comprobar después el resultado.
labels_reales = (
    muestra["label"]
    .astype(int)
    .tolist()
)


# Eliminamos columnas que el modelo NO utiliza
datos_modelo = muestra.drop(
    columns=[
        "id",
        "attack_cat",
        "label"
    ]
)


# Convertimos las 100 filas a una lista
# de diccionarios.
registros = datos_modelo.to_dict(
    orient="records"
)


print("=" * 60)
print("PRUEBA DE PREDICCIÓN POR LOTE - PROTECKEY")
print("=" * 60)

print(
    "\nRegistros enviados:",
    len(registros)
)


# ==========================================
# ENVIAR AL DETECTION SERVICE
# ==========================================

respuesta = requests.post(
    (
        "http://127.0.0.1:8002"
        "/detection/predict-batch"
    ),
    json={
        "data": registros
    },
    timeout=30
)


print(
    "\nCódigo HTTP:",
    respuesta.status_code
)


resultado = respuesta.json()


print("\nRespuesta general:")
print(
    "Total:",
    resultado.get("total")
)

print(
    "Normales detectados:",
    resultado.get("normal")
)

print(
    "Potencialmente maliciosos:",
    resultado.get(
        "potentially_malicious"
    )
)

print(
    "Porcentaje potencialmente malicioso:",
    resultado.get(
        "malicious_percentage"
    ),
    "%"
)


# ==========================================
# COMPARACIÓN CONTROLADA
# ==========================================

if resultado.get("status") == "success":

    predicciones = [
        registro["prediction"]
        for registro in resultado["results"]
    ]

    correctos = sum(
        real == predicho
        for real, predicho in zip(
            labels_reales,
            predicciones
        )
    )

    print(
        "\nAciertos sobre los 100 registros:",
        correctos
    )