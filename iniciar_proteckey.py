
import atexit
import os
import subprocess
import sys
from pathlib import Path

import webview
from dotenv import load_dotenv

# Ubicación principal del proyecto
BASE_DIR = Path(__file__).resolve().parent
MONITOR = BASE_DIR / "unified_monitor.py"

# Dirección de la aplicación
URL = "http://localhost:5173/monitoreo"

# Cargar las variables del archivo .env
load_dotenv(BASE_DIR / ".env")

proceso = None


def detener_monitor():
    global proceso

    if proceso is None or proceso.poll() is not None:
        return

    print("[ProtecKey] Deteniendo monitoreo...")

    # Detener el proceso y sus posibles procesos hijos en Windows
    subprocess.run(
        [
            "taskkill",
            "/PID",
            str(proceso.pid),
            "/T",
            "/F"
        ],
        capture_output=True,
        text=True
    )

    try:
        proceso.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proceso.kill()
        proceso.wait()

    proceso = None
    print("[ProtecKey] Monitoreo detenido.")


def iniciar_monitor():
    global proceso

    if not MONITOR.exists():
        raise FileNotFoundError(
            "No se encontró unified_monitor.py"
        )

    if not os.getenv("LIVE_MONITOR_TOKEN"):
        raise RuntimeError(
            "No se encontró LIVE_MONITOR_TOKEN en .env"
        )

    proceso = subprocess.Popen(
        [sys.executable, str(MONITOR)],
        cwd=str(BASE_DIR),
        env=os.environ.copy()
    )

    print("[ProtecKey] Monitor iniciado.")
    print(f"[ProtecKey] PID: {proceso.pid}")


def main():
    atexit.register(detener_monitor)

    print("================================")
    print("       PROTECKEY")
    print("================================")

    try:
        iniciar_monitor()

        print("[ProtecKey] Abriendo aplicación...")

        webview.create_window(
            "ProtecKey - Monitoreo de red",
            URL,
            width=1300,
            height=850,
            min_size=(950, 650)
        )

        # Mantiene la aplicación abierta hasta cerrar su ventana
        webview.start(debug=False)

    except Exception as error:
        print(f"[ERROR] {error}")

    finally:
        detener_monitor()
        print("[ProtecKey] Aplicación finalizada.")


if __name__ == "__main__":
    main()
