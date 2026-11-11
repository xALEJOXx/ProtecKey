
import subprocess
import sys
from pathlib import Path

# Directorio principal de ProtecKey
BASE_DIR = Path(__file__).resolve().parent

# Archivo encargado de capturar el tráfico
MONITOR_SCRIPT = BASE_DIR / "unified_monitor.py"

# Proceso del monitor
proceso_monitor = None


def iniciar_monitor():
    global proceso_monitor

    # Evitar que se ejecuten varios monitores simultáneamente.
    if proceso_monitor is not None and proceso_monitor.poll() is None:
        return {
            "estado": "activo",
            "mensaje": "El monitoreo ya está funcionando."
        }

    if not MONITOR_SCRIPT.exists():
        return {
            "estado": "error",
            "mensaje": "No se encontró unified_monitor.py."
        }

    try:
        proceso_monitor = subprocess.Popen(
            [sys.executable, str(MONITOR_SCRIPT)],
            cwd=str(BASE_DIR)
        )

        return {
            "estado": "activo",
            "mensaje": "Monitoreo iniciado correctamente.",
            "pid": proceso_monitor.pid
        }

    except Exception as error:
        return {
            "estado": "error",
            "mensaje": str(error)
        }


def detener_monitor():
    global proceso_monitor

    if proceso_monitor is None or proceso_monitor.poll() is not None:
        return {
            "estado": "inactivo",
            "mensaje": "No hay un monitoreo activo."
        }

    try:
        proceso_monitor.terminate()

        try:
            proceso_monitor.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proceso_monitor.kill()
            proceso_monitor.wait()

        proceso_monitor = None

        return {
            "estado": "inactivo",
            "mensaje": "Monitoreo detenido correctamente."
        }

    except Exception as error:
        return {
            "estado": "error",
            "mensaje": str(error)
        }


def estado_monitor():
    if proceso_monitor is not None and proceso_monitor.poll() is None:
        return {
            "estado": "activo",
            "pid": proceso_monitor.pid
        }

    return {
        "estado": "inactivo"
    }
