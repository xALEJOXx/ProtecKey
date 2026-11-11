
import os
import requests

API_URL = "http://127.0.0.1:8000/api/live/flows"


def enviar_flujo(datos):
    """
    Envía las estadísticas de un flujo de red
    al API Gateway de ProtecKey.
    """

    token = os.getenv("LIVE_MONITOR_TOKEN")

    if not token:
        print("[ERROR] No se configuró LIVE_MONITOR_TOKEN")
        return False

    try:
        respuesta = requests.post(
            API_URL,
            json=datos,
            headers={
                "X-Monitor-Token": token
            },
            timeout=5
        )

        respuesta.raise_for_status()

        return True

    except requests.RequestException as error:
        print(f"[ERROR] No se pudo enviar el flujo: {error}")
        return False
