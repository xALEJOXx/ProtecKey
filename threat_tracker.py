from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from threading import Lock


class SeguimientoAmenazas:
    """
    Detecta repeticiones de predicciones sospechosas.

    No ejecuta bloqueos.
    No confirma que exista un ataque.
    """

    def __init__(self, ventana_minutos=5, umbral=3):
        self.ventana = timedelta(minutes=ventana_minutos)
        self.umbral = umbral
        self.registros = defaultdict(deque)
        self.lock = Lock()

    def evaluar(self, resultado):
        prediccion = int(resultado.get("prediccion", 0))

        origen = resultado.get("origen") or []
        destino = resultado.get("destino") or []

        ip_origen = str(origen[0]) if origen else None
        ip_destino = str(destino[0]) if destino else None

        # Solo analizar predicciones sospechosas
        if prediccion != 1 or not ip_origen or not ip_destino:
            return {
                "repeticiones": 0,
                "actividad_repetitiva": False,
                "evidencia_independiente": False
            }

        ahora = datetime.now(timezone.utc)

        # Identificar conexiones por origen y destino
        clave = (ip_origen, ip_destino)

        with self.lock:
            eventos = self.registros[clave]

            # Eliminar eventos fuera de la ventana
            limite = ahora - self.ventana

            while eventos and eventos[0] < limite:
                eventos.popleft()

            eventos.append(ahora)

            cantidad = len(eventos)

        return {
            "repeticiones": cantidad,
            "actividad_repetitiva": cantidad >= self.umbral,
            "evidencia_independiente": False
        }
