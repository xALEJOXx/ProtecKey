from pathlib import Path

import joblib
import pandas as pd

from flow_tracker import AdministradorFlujos
from ml_features import extraer_caracteristicas


print("PRUEBA DE PREDICCION ML - PROTECKEY")
print("=" * 60)

ruta_modelo = Path(
    "models/modelo_proteckey_flujos_experimental.joblib"
)

assert ruta_modelo.exists(), (
    "No se encontro el modelo experimental."
)

modelo = joblib.load(ruta_modelo)

administrador = AdministradorFlujos(
    tiempo_inactividad=30
)

# Flujo TCP simulado.
origen_tcp = ("192.168.1.10", 50000)
destino_tcp = ("192.168.1.20", 443)

# Flujo UDP simulado.
origen_udp = ("192.168.1.30", 53000)
destino_udp = ("192.168.1.40", 9999)

paquetes = [
    ("tcp", origen_tcp, destino_tcp, 45, 1000.0),
    ("tcp", destino_tcp, origen_tcp, 49, 1000.5),
    ("tcp", origen_tcp, destino_tcp, 54, 1001.0),
    ("udp", origen_udp, destino_udp, 36, 1002.0),
    ("udp", destino_udp, origen_udp, 41, 1002.2),
]

for protocolo, origen, destino, tamano, tiempo in paquetes:
    administrador.registrar_paquete(
        protocolo=protocolo,
        origen=origen,
        destino=destino,
        tamano=tamano,
        tiempo=tiempo
    )

flujos = administrador.obtener_flujos()

caracteristicas = [
    extraer_caracteristicas(flujo)
    for flujo in flujos
]

columnas = [
    "dur",
    "proto",
    "spkts",
    "dpkts",
    "sbytes",
    "dbytes",
    "rate",
    "sload",
    "dload",
    "sinpkt",
    "dinpkt"
]

datos = pd.DataFrame(
    caracteristicas,
    columns=columnas
)

print("\nFLUJOS PARA EVALUAR:", len(datos))

assert len(datos) == 2

predicciones = modelo.predict(datos)
probabilidades = modelo.predict_proba(datos)

clases = list(modelo.classes_)

assert 1 in clases, (
    "El modelo no contiene la clase de ataque."
)

indice_ataque = clases.index(1)

for indice, fila in datos.iterrows():

    probabilidad = float(
        probabilidades[indice][indice_ataque]
    )

    print("\nFLUJO:", indice + 1)
    print("Protocolo:", fila["proto"])
    print("Prediccion:", int(predicciones[indice]))
    print(
        "Probabilidad de ataque:",
        round(probabilidad * 100, 2),
        "%"
    )

    assert 0 <= probabilidad <= 1

print("\nMODELO EXPERIMENTAL EJECUTADO CORRECTAMENTE")
