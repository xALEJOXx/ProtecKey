from traffic_direction import clasificar_direccion_trafico


def identificar_inicio_conexion(sesion_tcp, ips_locales):
    """
    Identifica desde donde se observo el inicio TCP.

    Requiere una sesion creada a partir de un SYN sin ACK.
    No confirma ataques y no ejecuta bloqueos.
    """

    if not isinstance(sesion_tcp, dict):
        return {
            "inicio": "desconocido",
            "motivo": "No se observo el inicio TCP",
            "estado_tcp": None,
            "ip_remota": None
        }

    cliente = sesion_tcp.get("cliente")
    servidor = sesion_tcp.get("servidor")
    estado = sesion_tcp.get("estado")

    if not cliente or not servidor:
        return {
            "inicio": "desconocido",
            "motivo": "Faltan los extremos de la conexion",
            "estado_tcp": estado,
            "ip_remota": None
        }

    try:
        ip_cliente = cliente[0]
        ip_servidor = servidor[0]
    except (TypeError, IndexError, KeyError):
        return {
            "inicio": "desconocido",
            "motivo": "Los extremos TCP no tienen un formato valido",
            "estado_tcp": estado,
            "ip_remota": None
        }

    direccion = clasificar_direccion_trafico(
        ip_cliente,
        ip_servidor,
        ips_locales
    )

    equivalencias = {
        "saliente": "local",
        "entrante": "remoto",
        "local": "local",
        "indeterminada": "desconocido",
        "desconocida": "desconocido"
    }

    inicio = equivalencias.get(
        direccion["direccion"],
        "desconocido"
    )

    return {
        "inicio": inicio,
        "motivo": direccion["motivo"],
        "estado_tcp": estado,
        "ip_remota": direccion["ip_remota"]
    }
