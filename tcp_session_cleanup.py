"""
Limpieza de sesiones TCP asociadas al seguimiento ML.

Conserva las sesiones de flujos activos y elimina
las que ya no son necesarias.
"""


def limpiar_sesiones_tcp(sesiones_tcp, administrador_ml):
    """
    Elimina sesiones TCP sin un flujo ML activo.

    Debe ejecutarse despues de evaluar todos los
    flujos ML finalizados del ciclo.
    """

    claves_activas = set(administrador_ml.flujos.keys())

    eliminadas = 0

    for clave in list(sesiones_tcp.keys()):

        if clave not in claves_activas:
            del sesiones_tcp[clave]
            eliminadas += 1

    return {
        "eliminadas": eliminadas,
        "conservadas": len(sesiones_tcp)
    }
