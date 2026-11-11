import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


RUTA_REGISTRO = (
    Path(__file__).resolve().parent
    / "logs"
    / "protection_decisions.jsonl"
)

LOCK_REGISTRO = Lock()


def construir_decision(analisis):
    """
    Construye una decision de proteccion explicable.

    No ejecuta acciones sobre el firewall.
    """

    proteccion = analisis.get("proteccion_ip") or {}

    ip = analisis.get("ip_origen")
    gravedad = analisis.get("gravedad", "sin clasificar")
    protegida = proteccion.get("protegida", True)
    candidata = analisis.get("candidata_respuesta", False)

    if protegida:
        decision = "no_bloquear"
        motivo = proteccion.get(
            "motivo",
            "Direccion protegida por seguridad"
        )
        accion = "Registrar y mantener el monitoreo"

    elif candidata:
        decision = "revision_requerida"
        motivo = (
            "La IP requiere evidencia independiente "
            "y autorizacion antes de cualquier bloqueo"
        )
        accion = "Registrar y priorizar revision"

    else:
        decision = "solo_monitorear"
        motivo = "No se cumplen condiciones preliminares"
        accion = "Continuar monitoreo"

    return {
        "fecha_hora": datetime.now(timezone.utc).isoformat(),
        "ip_origen": ip,
        "ip_destino": analisis.get("ip_destino"),
        "gravedad": gravedad,
        "decision": decision,
        "motivo": motivo,
        "accion": accion,
        "ip_protegida": protegida,
        "candidata_respuesta": bool(candidata),
        "bloqueo_autorizado": False,
        "bloqueo_ejecutado": False,
        "modo": "simulacion"
    }


def registrar_decision(decision):
    """
    Guarda una decision en formato JSON Lines.
    Cada linea contiene un registro independiente.
    """

    RUTA_REGISTRO.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with LOCK_REGISTRO:
        with RUTA_REGISTRO.open(
            "a",
            encoding="utf-8"
        ) as archivo:
            archivo.write(
                json.dumps(
                    decision,
                    ensure_ascii=False
                ) + "\n"
            )

    return str(RUTA_REGISTRO)
