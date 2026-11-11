import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Cargar la configuración de ProtecKey.
load_dotenv(BASE_DIR / ".env")

if not os.getenv("LIVE_MONITOR_TOKEN"):
    raise RuntimeError(
        "No se encontró LIVE_MONITOR_TOKEN en .env"
    )

print("[PRUEBA] Iniciando monitor durante 40 segundos...", flush=True)

proceso = subprocess.Popen(
    [sys.executable, str(BASE_DIR / "unified_monitor.py")],
    cwd=BASE_DIR,
    env=os.environ.copy()
)

try:
    proceso.wait(timeout=40)

except subprocess.TimeoutExpired:
    print("[PRUEBA] Tiempo cumplido. Deteniendo monitor...", flush=True)

    proceso.terminate()

    try:
        proceso.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proceso.kill()
        proceso.wait()

finally:
    if proceso.poll() is None:
        proceso.kill()
        proceso.wait()

print("[PRUEBA] Monitor detenido.", flush=True)
