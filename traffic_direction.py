import ipaddress


def clasificar_direccion_trafico(origen, destino, ips_locales):
    """
    Clasifica el sentido observado de una conexion.

    No confirma quien inicio la sesion TCP.
    No realiza bloqueos.
    """

    try:
        ip_origen = ipaddress.ip_address(str(origen).split('%')[0])
        ip_destino = ipaddress.ip_address(str(destino).split('%')[0])

        locales = {
            ipaddress.ip_address(str(ip).split('%')[0])
            for ip in ips_locales
        }

    except (ValueError, TypeError):
        return {
            "direccion": "desconocida",
            "motivo": "No se pudieron validar las direcciones IP",
            "ip_remota": None
        }

    origen_local = ip_origen in locales
    destino_local = ip_destino in locales

    if origen_local and not destino_local:
        return {
            "direccion": "saliente",
            "motivo": "El paquete observado sale de una IP local",
            "ip_remota": str(ip_destino)
        }

    if destino_local and not origen_local:
        return {
            "direccion": "entrante",
            "motivo": "El paquete observado llega a una IP local",
            "ip_remota": str(ip_origen)
        }

    if origen_local and destino_local:
        return {
            "direccion": "local",
            "motivo": "Ambas direcciones pertenecen al equipo",
            "ip_remota": None
        }

    return {
        "direccion": "indeterminada",
        "motivo": "Ninguna direccion coincide con las IP locales",
        "ip_remota": None
    }
