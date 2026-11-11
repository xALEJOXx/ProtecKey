import ipaddress
from datetime import datetime, timezone
from protection_rules import evaluar_reglas_proteccion


def obtener_ip(extremo):
    """Extrae la IP de una conexion (IP, puerto)."""
    if isinstance(extremo, (list, tuple)) and extremo:
        return str(extremo[0])
    return None


def ip_publica_valida(ip):
    """Comprueba que la IP sea globalmente enrutable."""
    try:
        direccion = ipaddress.ip_address(ip)
        return direccion.is_global
    except (ValueError, TypeError):
        return False


def clasificar_amenaza(resultado, seguimiento=None):
    """
    Clasifica una prediccion experimental.

    No realiza bloqueos reales.
    No identifica por si sola un tipo especifico de ataque.
    """
    prediccion = int(resultado.get("prediccion", 0))
    probabilidad = float(
        resultado.get("probabilidad_ataque", 0)
    )

    origen = resultado.get("origen")
    destino = resultado.get("destino")

    ip_origen = obtener_ip(origen)
    ip_destino = obtener_ip(destino)

    # Evaluar si la IP de origen esta protegida.
    proteccion_ip = evaluar_reglas_proteccion(ip_origen)

    protocolo = str(
        resultado.get("protocolo", "desconocido")
    ).upper()

    evidencias = []
    recomendaciones = []

    if prediccion == 0:
        gravedad = "informativa"
        descripcion = (
            "El modelo no identifico actividad sospechosa "
            "en este flujo."
        )
        recomendaciones.append(
            "Mantener el monitoreo activo."
        )

    elif probabilidad >= 0.90:
        gravedad = "alta"
        descripcion = (
            "El modelo experimental identifico un flujo "
            "con alta probabilidad estimada de ataque."
        )
        evidencias.append(
            f"Probabilidad estimada: {probabilidad * 100:.1f}%"
        )
        recomendaciones.append(
            "Revisar el origen, destino y comportamiento "
            "de la conexion."
        )
        recomendaciones.append(
            "Buscar evidencia adicional antes de bloquear."
        )

    else:
        gravedad = "advertencia"
        descripcion = (
            "El modelo experimental identifico "
            "un posible comportamiento sospechoso."
        )
        evidencias.append(
            f"Probabilidad estimada: {probabilidad * 100:.1f}%"
        )
        recomendaciones.append(
            "Observar si la actividad se repite."
        )
        recomendaciones.append(
            "Verificar si corresponde a una aplicacion legitima."
        )

    # Incorporar el seguimiento de predicciones repetidas.
    if seguimiento and seguimiento.get("actividad_repetitiva"):
        cantidad = seguimiento.get("repeticiones", 0)

        evidencias.append(
            f"Se registraron {cantidad} predicciones sospechosas "
            "para el mismo par de IP dentro de la ventana de seguimiento."
        )

        recomendaciones.append(
            "Priorizar la revision de esta conexion y comprobar "
            "si el trafico corresponde a una actividad legitima."
        )

        # La repeticion aumenta la prioridad de revision,
        # pero no constituye evidencia independiente.
        if prediccion == 1:
            gravedad = "alta"

    # La gravedad critica requiere corroboracion independiente.
    # No se asigna automaticamente en esta primera version.

    # Nunca autorizar un bloqueo solo por la prediccion ML.
    bloqueo_autorizado = False

    return {
        "fecha_hora": datetime.now(timezone.utc).isoformat(),
        "gravedad": gravedad,
        "descripcion": descripcion,
        "protocolo": protocolo,
        "ip_origen": ip_origen,
        "ip_destino": ip_destino,
        "proteccion_ip": proteccion_ip,
        "candidata_respuesta": (
            prediccion == 1
            and proteccion_ip["candidata_evaluacion"]
        ),
        "probabilidad_ataque": probabilidad,
        "evidencias": evidencias,
        "recomendaciones": recomendaciones,
        "bloqueo_autorizado": bloqueo_autorizado,
        "modo": "simulacion",
        "experimental": True
    }
