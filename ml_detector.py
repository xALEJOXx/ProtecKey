from pathlib import Path

import joblib
import pandas as pd

from ml_features import extraer_caracteristicas


class DetectorMLExperimental:

    COLUMNAS = [
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

    def __init__(
        self,
        ruta_modelo="models/modelo_proteckey_flujos_experimental.joblib"
    ):

        ruta = Path(ruta_modelo)

        if not ruta.exists():
            raise FileNotFoundError(
                f"No se encontro el modelo: {ruta}"
            )

        self.modelo = joblib.load(ruta)

        clases = list(self.modelo.classes_)

        if 1 not in clases:
            raise ValueError(
                "El modelo no contiene la clase de ataque."
            )

        self.indice_ataque = clases.index(1)

    def evaluar_flujo(self, flujo):

        caracteristicas = extraer_caracteristicas(flujo)

        datos = pd.DataFrame(
            [caracteristicas],
            columns=self.COLUMNAS
        )

        prediccion = int(
            self.modelo.predict(datos)[0]
        )

        probabilidad = float(
            self.modelo.predict_proba(datos)[
                0, self.indice_ataque
            ]
        )

        return {
            "protocolo": flujo.protocolo,
            "origen": flujo.origen,
            "destino": flujo.destino,
            "prediccion": prediccion,
            "probabilidad_ataque": round(
                probabilidad, 4
            ),
            "caracteristicas": caracteristicas,
            "experimental": True,
            "estado_tcp_info": {
                "syn_observado": flujo.syn_observado,
                "synack_observado": flujo.synack_observado,
                "fin_observado": flujo.fin_observado,
                "rst_observado": flujo.rst_observado,
                "estado_tcp": flujo.estado_tcp,
                "motivo_retiro": flujo.motivo_retiro
            }
        }
