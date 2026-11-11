from connection_origin import identificar_inicio_conexion


def asociar_inicio_tcp(flujo, sesiones_tcp, ips_locales):
    """
    Asocia un flujo ML con una sesion TCP observada.

    Verifica:
    - Que el flujo sea TCP.
    - Que coincidan IP y puertos.
    - Que exista un SYN inicial registrado.
    - Que el SYN pertenezca temporalmente al flujo.

    No modifica el flujo ni autoriza bloqueos.
    """

    desconocido = {
        "inicio": "desconocido",
        "motivo": "No se encontro un inicio TCP verificable para este flujo",
        "estado_tcp": None,
        "ip_remota": None
    }

    if getattr(flujo, "protocolo", None) != "tcp":
        return {
            **desconocido,
            "motivo": "El protocolo no utiliza establecimiento TCP"
        }

    try:
        clave = (
            "tcp",
            tuple(sorted((flujo.origen, flujo.destino)))
        )

        sesion = sesiones_tcp.get(clave)

        if not isinstance(sesion, dict):
            return desconocido

        tiempo_syn = sesion.get("tiempo_syn")
        inicio_flujo = getattr(flujo, "inicio", None)
        ultimo_flujo = getattr(flujo, "ultimo", None)

        if any(
            valor is None
            for valor in (tiempo_syn, inicio_flujo, ultimo_flujo)
        ):
            return {
                **desconocido,
                "motivo": "No hay marcas de tiempo suficientes"
            }

        tiempo_syn = float(tiempo_syn)
        inicio_flujo = float(inicio_flujo)
        ultimo_flujo = float(ultimo_flujo)

        # El SYN debe haber sido observado dentro de la
        # ventana temporal correspondiente al flujo ML.
        tolerancia = 0.1

        if not (
            inicio_flujo - tolerancia
            <= tiempo_syn
            <= ultimo_flujo + tolerancia
        ):
            return {
                **desconocido,
                "motivo": "La sesion TCP no corresponde temporalmente al flujo"
            }

        return identificar_inicio_conexion(
            sesion,
            ips_locales
        )

    except (TypeError, ValueError, KeyError, AttributeError):
        return {
            **desconocido,
            "motivo": "No se pudo validar la asociacion TCP"
        }
