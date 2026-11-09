import pandas as pd
import requests


# Cargamos el conjunto de prueba.
test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Seleccionamos el primer registro.
registro = test.iloc[0].copy()


# Guardamos información únicamente para comprobar
# posteriormente cuál era la clase real.
clase_real = int(registro["label"])
categoria_real = registro["attack_cat"]


# Eliminamos las columnas que NO recibe el modelo.
registro = registro.drop(
    labels=[
        "id",
        "attack_cat",
        "label"
    ]
)


# Convertimos el registro a diccionario.
datos = registro.to_dict()


# Creamos la petición esperada por Data Service.
peticion = {
    "data": datos
}


# Enviamos el registro al servicio.
respuesta = requests.post(
    "http://127.0.0.1:8001/data/validate",
    json=peticion
)


print("Código HTTP:", respuesta.status_code)

print("\nRespuesta del Data Service:")
print(respuesta.json())

print("\nInformación real del registro:")
print("Label:", clase_real)
print("Categoría:", categoria_real)