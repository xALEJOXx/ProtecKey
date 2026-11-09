import pandas as pd
import requests


# Cargar dataset
test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Seleccionamos un registro malicioso real
registro = test[
    test["label"] == 1
].iloc[0].copy()


# Información real utilizada únicamente
# para comprobar el resultado.
label_real = int(
    registro["label"]
)

categoria_real = registro[
    "attack_cat"
]


# Eliminamos columnas que no utiliza el modelo
registro = registro.drop(
    labels=[
        "id",
        "attack_cat",
        "label"
    ]
)


datos = registro.to_dict()


# IMPORTANTE:
# Ahora enviamos la petición al API Gateway,
# no directamente al Data Service.
respuesta = requests.post(
    "http://127.0.0.1:8000/api/analyze",
    json={
        "data": datos
    },
    timeout=20
)


print("=" * 55)
print("PRUEBA API PRINCIPAL - PROTECKEY")
print("=" * 55)

print(
    "\nCódigo HTTP:",
    respuesta.status_code
)

print(
    "\nRespuesta:"
)

print(
    respuesta.json()
)

print(
    "\nInformación real utilizada para evaluación:"
)

print(
    "Label:",
    label_real
)

print(
    "Categoría:",
    categoria_real
)