import os
import requests
from pathlib import Path


def _cargar_token():
    token = os.getenv("LIVE_MONITOR_TOKEN")

    if token:
        return token

    archivo = Path(__file__).resolve().parent / ".env"

    if archivo.exists():
        for linea in archivo.read_text(encoding="utf-8-sig").splitlines():
            linea = linea.strip()

            if not linea or linea.startswith("#"):
                continue

            clave, separador, valor = linea.partition("=")

            if separador and clave.strip() == "LIVE_MONITOR_TOKEN":
                return valor.strip().strip('"').strip("'")

    return None


def enviar_prediccion_ml(resultado):
    """
    Envia una prediccion LightGBM al API Gateway.
    No altera el resultado original del modelo.
    """

    token = _cargar_token()

    if not token:
        print("[ML API] Token no configurado.")
        return False

    url_base = os.getenv(
        "PROTECKEY_API_URL",
        "http://127.0.0.1:8000"
    ).rstrip("/")

    try:
        respuesta = requests.post(
            f"{url_base}/api/ml/predictions",
            json=resultado,
            headers={
                "X-Monitor-Token": token
            },
            timeout=5
        )

        if respuesta.status_code in (200, 201):
            registro = respuesta.json().get("registro", {})

            print(
                "[ML API] Prediccion almacenada. ID:",
                registro.get("id")
            )

            return True

        print(
            "[ML API] No se guardo la prediccion. HTTP:",
            respuesta.status_code
        )

        return False

    except requests.RequestException as error:
        print(
            "[ML API] Error de comunicacion:",
            type(error).__name__
        )

        return False
