import json
import ipaddress
from pathlib import Path

from ip_protection import evaluar_ip_protegida


RUTA_CONFIG = Path(__file__).resolve().parent / "protection_config.json"


def cargar_configuracion():
    with RUTA_CONFIG.open("r", encoding="utf-8-sig") as archivo:
        return json.load(archivo)


def evaluar_reglas_proteccion(ip):
    """
    Evalua exclusiones de seguridad.

    No autoriza ni ejecuta bloqueos reales.
    """

    configuracion = cargar_configuracion()

    proteccion = evaluar_ip_protegida(ip)

    resultado = {
        "ip": str(ip),
        "protegida": True,
        "motivo": "",
        "candidata_evaluacion": False,
        "bloqueo_autorizado": False,
        "modo": "simulacion"
    }

    if proteccion["protegida"]:
        resultado["motivo"] = proteccion["motivo"]
        return resultado

    direccion = ipaddress.ip_address(ip)

    for ip_excluida in configuracion.get("ips_excluidas", []):
        if direccion == ipaddress.ip_address(ip_excluida):
            resultado["motivo"] = "IP incluida en la lista de exclusiones"
            return resultado

    for red_excluida in configuracion.get("redes_excluidas", []):
        red = ipaddress.ip_network(red_excluida, strict=False)

        if direccion in red:
            resultado["motivo"] = "IP perteneciente a una red excluida"
            return resultado

    resultado["protegida"] = False
    resultado["motivo"] = (
        "IP publica sin exclusion; requiere corroboracion "
        "independiente y autorizacion adicional"
    )
    resultado["candidata_evaluacion"] = True

    return resultado
