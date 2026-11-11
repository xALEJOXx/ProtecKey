import csv
from datetime import datetime
from pathlib import Path


RUTA_CSV = Path(
    "data/ml/predicciones_experimentales.csv"
)

COLUMNAS = [
    "fecha",
    "protocolo",
    "ip_origen",
    "puerto_origen",
    "ip_destino",
    "puerto_destino",
    "prediccion",
    "probabilidad_ataque",
    "dur",
    "spkts",
    "dpkts",
    "sbytes",
    "dbytes",
    "rate",
    "sload",
    "dload",
    "sinpkt",
    "dinpkt",
    "syn_observado",
    "synack_observado",
    "fin_observado",
    "rst_observado",
    "estado_tcp",
    "motivo_retiro"
]


def guardar_prediccion_ml(resultado, ruta=RUTA_CSV):

    ruta = Path(ruta)
    ruta.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    caracteristicas = resultado["caracteristicas"]
    estado_tcp = resultado.get("estado_tcp_info", {})

    origen = resultado["origen"]
    destino = resultado["destino"]

    registro = {
        "fecha": datetime.now().astimezone().isoformat(
            timespec="seconds"
        ),
        "protocolo": resultado["protocolo"],
        "ip_origen": origen[0],
        "puerto_origen": origen[1],
        "ip_destino": destino[0],
        "puerto_destino": destino[1],
        "prediccion": resultado["prediccion"],
        "probabilidad_ataque": resultado["probabilidad_ataque"],
    }

    for columna in [
        "dur",
        "spkts",
        "dpkts",
        "sbytes",
        "dbytes",
        "rate",
        "sload",
        "dload",
        "sinpkt",
        "dinpkt"
    ]:
        registro[columna] = caracteristicas[columna]

     # Metadatos TCP: no son entradas del modelo ML.
    registro["syn_observado"] = estado_tcp.get(
        "syn_observado", False
    )

    registro["synack_observado"] = estado_tcp.get(
        "synack_observado", False
    )

    registro["fin_observado"] = estado_tcp.get(
        "fin_observado", False
    )

    registro["rst_observado"] = estado_tcp.get(
        "rst_observado", False
    )

    registro["estado_tcp"] = estado_tcp.get(
        "estado_tcp", ""
    )

    registro["motivo_retiro"] = estado_tcp.get(
    "motivo_retiro", ""
    )

    archivo_nuevo = (
        not ruta.exists()
        or ruta.stat().st_size == 0
    )

    with ruta.open(
        "a",
        newline="",
        encoding="utf-8"
    ) as archivo:

        escritor = csv.DictWriter(
            archivo,
            fieldnames=COLUMNAS
        )

        if archivo_nuevo:
            escritor.writeheader()

        escritor.writerow(registro)

    return ruta
