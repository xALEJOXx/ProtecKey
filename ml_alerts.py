import time

ULTIMA_ALERTA = {}
INTERVALO_SEGUNDOS = 300


def notificar_prediccion_ml(resultado):
    if int(resultado.get("prediccion", 0)) != 1:
        return False

    destino = resultado.get("destino") or ("Desconocida", 0)
    protocolo = str(resultado.get("protocolo", "RED")).upper()
    ip_destino = str(destino[0])
    probabilidad = float(resultado.get("probabilidad_ataque", 0)) * 100

    clave = (protocolo, ip_destino)
    ahora = time.monotonic()

    if ahora - ULTIMA_ALERTA.get(clave, -float("inf")) < INTERVALO_SEGUNDOS:
        return False

    try:
        from winotify import Notification

        notificacion = Notification(
            app_id="ProtecKey",
            title="ProtecKey - Actividad sospechosa",
            msg=(
                f"Conexion {protocolo} hacia {ip_destino}\n"
                f"Probabilidad estimada: {probabilidad:.1f}%\n"
                "Deteccion experimental; verificar antes de actuar."
            ),
            duration="short"
        )

        notificacion.show()
        ULTIMA_ALERTA[clave] = ahora

        print(
            f"[ML ALERTA] Notificacion enviada: "
            f"{ip_destino} ({probabilidad:.1f}%)"
        )

        return True

    except Exception as error:
        print("[ML ALERTA] No se pudo mostrar:", type(error).__name__)
        return False
