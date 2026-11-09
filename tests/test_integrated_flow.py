import pandas as pd
import requests


# Cargamos el conjunto de datos de prueba.
test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Seleccionamos un registro cuya clase real
# corresponde a comportamiento malicioso.
registro = test[
    test["label"] == 1
].iloc[0].copy()


# Guardamos la información real para poder
# compararla posteriormente con la predicción.
clase_real = int(registro["label"])
categoria_real = registro["attack_cat"]


# Eliminamos las columnas que NO forman parte
# de las características utilizadas por el modelo.
registro = registro.drop(
    labels=[
        "id",
        "attack_cat",
        "label"
    ]
)


# Convertimos las 42 características
# del registro en un diccionario.
datos = registro.to_dict()


# Enviamos el registro al Data Service.
# Importante: esta prueba NO llama directamente
# al Detection Service.
respuesta = requests.post(
    "http://127.0.0.1:8001/data/analyze",
    json={
        "data": datos
    },
    timeout=15
)


# Mostramos la respuesta obtenida.
print(
    "Código HTTP:",
    respuesta.status_code
)

print(
    "\nRespuesta completa de ProtecKey:"
)

print(
    respuesta.json()
)


# Mostramos la información real únicamente
# para comparar el resultado.
print(
    "\nInformación real:"
)

print(
    "Label:",
    clase_real
)

print(
    "Categoría:",
    categoria_real
)