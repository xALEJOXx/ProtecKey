import pandas as pd
import requests


# Cargamos el conjunto de prueba.
test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Seleccionamos el primer registro.
registro = test[test["label"] == 1].iloc[0].copy()


# Guardamos la información real.
clase_real = int(registro["label"])
categoria_real = registro["attack_cat"]


# Eliminamos las columnas que el modelo
# no utiliza como entrada.
registro = registro.drop(
    labels=[
        "id",
        "attack_cat",
        "label"
    ]
)


# Convertimos a diccionario.
datos = registro.to_dict()


# Creamos la petición.
peticion = {
    "data": datos
}


# Enviamos el registro al Detection Service.
respuesta = requests.post(
    "http://127.0.0.1:8002/detection/predict",
    json=peticion
)


print("Código HTTP:", respuesta.status_code)

print("\nRespuesta de ProtecKey:")
print(respuesta.json())

print("\nResultado real:")
print("Label:", clase_real)
print("Categoría:", categoria_real)