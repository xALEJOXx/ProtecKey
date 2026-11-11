import ipaddress


def evaluar_ip_protegida(ip):
    """
    Evalua si una IP puede considerarse candidata
    para una futura respuesta automatica.

    No ejecuta bloqueos.
    """

    try:
        direccion = ipaddress.ip_address(ip)
    except (ValueError, TypeError):
        return {
            "ip": str(ip),
            "protegida": True,
            "motivo": "Direccion IP invalida o desconocida"
        }

    if direccion.is_loopback:
        motivo = "Direccion de loopback del equipo"

    elif direccion.is_private:
        motivo = "Direccion privada, local o reservada"

    elif direccion.is_link_local:
        motivo = "Direccion de enlace local"

    elif direccion.is_multicast:
        motivo = "Direccion multicast"

    elif direccion.is_unspecified:
        motivo = "Direccion no especificada"

    elif direccion.is_reserved:
        motivo = "Direccion reservada"

    elif not direccion.is_global:
        motivo = "Direccion no enrutable globalmente"

    else:
        return {
            "ip": str(direccion),
            "protegida": False,
            "motivo": "IP global; requiere verificaciones adicionales"
        }

    return {
        "ip": str(direccion),
        "protegida": True,
        "motivo": motivo
    }
