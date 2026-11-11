from tcp_session_cleanup import limpiar_sesiones_tcp

from scapy.all import sniff, IP, TCP, UDP
from datetime import datetime
from live_sender import enviar_flujo
import time

# ==============================================
# PROTECKEY - MONITOR UNIFICADO DE RED
# ==============================================

INTERFAZ = "Wi-Fi"
DURACION = 5

from flow_tracker import AdministradorFlujos
from ml_detector import DetectorMLExperimental
from ml_logger import guardar_prediccion_ml
from ml_sender import enviar_prediccion_ml
from ml_alerts import notificar_prediccion_ml
from threat_response import clasificar_amenaza
from protection_audit import construir_decision, registrar_decision
from threat_tracker import SeguimientoAmenazas
from local_network import obtener_ips_locales
from tcp_flow_association import asociar_inicio_tcp


seguimiento_amenazas = SeguimientoAmenazas(ventana_minutos=5, umbral=3)
ips_locales_proteckey = obtener_ips_locales()

flujos = {}
sesiones_tcp = {}

# Seguimiento independiente para Machine Learning
administrador_ml = AdministradorFlujos(
    tiempo_inactividad=30
)
# Detector ML independiente: solo observacion.
detector_ml_experimental = None

try:
    detector_ml_experimental = DetectorMLExperimental()
    print("[ML] Detector experimental cargado correctamente.")

except Exception as error:
    print(
        "[ML] Detector experimental no disponible:",
        error
    )

MODULO_TCP = 2 ** 32


def promedio_intervalos(tiempos):
    """Calcula el intervalo medio en milisegundos."""
    if len(tiempos) < 2:
        return None

    tiempos = sorted(tiempos)

    diferencias = [
        tiempos[i] - tiempos[i - 1]
        for i in range(1, len(tiempos))
    ]

    return sum(diferencias) / len(diferencias) * 1000


def mostrar_valor(valor, decimales=3):
    if valor is None:
        return "N/D"

    return f"{valor:.{decimales}f}"


def nueva_sesion_tcp(cliente, servidor, secuencia, tiempo):
    return {
        "cliente": cliente,
        "servidor": servidor,
        "seq_cliente": secuencia,
        "seq_servidor": None,
        "tiempo_syn": tiempo,
        "tiempo_synack": None,
        "tiempo_ack": None,
        "estado": "SYN_OBSERVADO",
        "retransmisiones_syn": 0,
        "synack_ms": None,
        "ackdat_ms": None,
        "tcprtt_ms": None
    }


def validar_tcp(clave, origen, destino, tcp, tiempo):
    """
    Sigue el establecimiento TCP comprobando
    nÃºmeros de secuencia y reconocimiento.
    """

    syn = bool(tcp.flags & 0x02)
    ack = bool(tcp.flags & 0x10)
    rst = bool(tcp.flags & 0x04)

    secuencia = int(tcp.seq)
    reconocimiento = int(tcp.ack)

    # ------------------------------------------
    # SYN inicial
    # ------------------------------------------

    if syn and not ack:

        if clave in sesiones_tcp:
            sesion = sesiones_tcp[clave]

            if (
                sesion["cliente"] == origen
                and sesion["seq_cliente"] == secuencia
            ):
                sesion["retransmisiones_syn"] += 1
                return

        sesiones_tcp[clave] = nueva_sesion_tcp(
            origen,
            destino,
            secuencia,
            tiempo
        )

        return

    if clave not in sesiones_tcp:
        return

    sesion = sesiones_tcp[clave]

    if sesion["estado"] in (
        "ESTABLECIDA",
        "REINICIADA"
    ):
        return

    # ------------------------------------------
    # SYN-ACK del servidor
    # ------------------------------------------

    if syn and ack:

        if origen != sesion["servidor"]:
            return

        ack_esperado = (
            sesion["seq_cliente"] + 1
        ) % MODULO_TCP

        if reconocimiento != ack_esperado:
            return

        if sesion["tiempo_synack"] is None:
            sesion["seq_servidor"] = secuencia
            sesion["tiempo_synack"] = tiempo
            sesion["estado"] = "SYNACK_OBSERVADO"

        return

    # ------------------------------------------
    # ConexiÃ³n reiniciada
    # ------------------------------------------

    if rst:
        sesion["estado"] = "REINICIADA"
        return

    # ------------------------------------------
    # ACK final del cliente
    # ------------------------------------------

    if not ack or syn:
        return

    if origen != sesion["cliente"]:
        return

    if sesion["estado"] != "SYNACK_OBSERVADO":
        return

    ack_esperado = (
        sesion["seq_servidor"] + 1
    ) % MODULO_TCP

    seq_esperada = (
        sesion["seq_cliente"] + 1
    ) % MODULO_TCP

    if reconocimiento != ack_esperado:
        return

    if secuencia != seq_esperada:
        return

    if tiempo < sesion["tiempo_synack"]:
        return

    sesion["tiempo_ack"] = tiempo
    sesion["estado"] = "ESTABLECIDA"

    sesion["synack_ms"] = (
        sesion["tiempo_synack"]
        - sesion["tiempo_syn"]
    ) * 1000

    sesion["ackdat_ms"] = (
        sesion["tiempo_ack"]
        - sesion["tiempo_synack"]
    ) * 1000

    sesion["tcprtt_ms"] = (
        sesion["tiempo_ack"]
        - sesion["tiempo_syn"]
    ) * 1000

    print(
        f"[TCP VALIDADO] "
        f"{sesion['cliente']} -> "
        f"{sesion['servidor']} | "
        f"RTT observado: "
        f"{sesion['tcprtt_ms']:.3f} ms"
    )


def procesar_paquete(paquete):
    if IP not in paquete:
        return

    ip_origen = paquete[IP].src
    ip_destino = paquete[IP].dst

    if TCP in paquete:
        protocolo = "tcp"
        transporte = paquete[TCP]

    elif UDP in paquete:
        protocolo = "udp"
        transporte = paquete[UDP]

    else:
        return

    origen = (
        ip_origen,
        int(transporte.sport)
    )

    destino = (
        ip_destino,
        int(transporte.dport)
    )

    clave = (
        protocolo,
        tuple(sorted((origen, destino)))
    )

    tiempo = float(paquete.time)
    tamano = len(paquete[IP])

    # Obtener las banderas TCP cuando corresponda.
    banderas_tcp = None

    if protocolo == "tcp":
        banderas_tcp = int(transporte.flags)

    # Registrar el paquete y sus banderas en el
    # administrador persistente de Machine Learning.
    administrador_ml.registrar_paquete(
        protocolo=protocolo,
        origen=origen,
        destino=destino,
        tamano=tamano,
        tiempo=tiempo,
        banderas_tcp=banderas_tcp
    )

    # ------------------------------------------
    # Crear flujo
    # ------------------------------------------

    if clave not in flujos:
        flujos[clave] = {
            "origen": origen,
            "destino": destino,
            "inicio": tiempo,
            "ultimo": tiempo,
            "spkts": 0,
            "dpkts": 0,
            "sbytes": 0,
            "dbytes": 0,
            "tiempos_origen": [],
            "tiempos_destino": [],
            "banderas_tcp": set()
        }

    flujo = flujos[clave]

    flujo["inicio"] = min(
        flujo["inicio"],
        tiempo
    )

    flujo["ultimo"] = max(
        flujo["ultimo"],
        tiempo
    )

    # ------------------------------------------
    # EstadÃ­sticas por direcciÃ³n
    # ------------------------------------------

    if origen == flujo["origen"]:
        flujo["spkts"] += 1
        flujo["sbytes"] += tamano
        flujo["tiempos_origen"].append(tiempo)

    else:
        flujo["dpkts"] += 1
        flujo["dbytes"] += tamano
        flujo["tiempos_destino"].append(tiempo)

    # ------------------------------------------
    # Seguimiento TCP
    # ------------------------------------------

    if protocolo == "tcp":
        flujo["banderas_tcp"].update(
            str(transporte.flags)
        )

        validar_tcp(
            clave,
            origen,
            destino,
            transporte,
            tiempo
        )


def enviar_resultados_api():
    """
    EnvÃ­a los flujos capturados al API Gateway.
    Solo transmite estadÃ­sticas observadas.
    No realiza predicciones de ataques.
    """

    enviados = 0
    fallidos = 0

    for clave, flujo in flujos.items():
        protocolo = clave[0]

        duracion = max(
            flujo["ultimo"] - flujo["inicio"],
            0
        )

        spkts = flujo["spkts"]
        dpkts = flujo["dpkts"]
        sbytes = flujo["sbytes"]
        dbytes = flujo["dbytes"]

        # Evitar divisiones entre cero.
        if duracion > 0:
            rate = (spkts + dpkts) / duracion
            sload = (sbytes * 8) / duracion
            dload = (dbytes * 8) / duracion
        else:
            rate = 0
            sload = 0
            dload = 0

        sesion = sesiones_tcp.get(clave)

        datos = {
            "ip_origen": flujo["origen"][0],
            "puerto_origen": flujo["origen"][1],
            "ip_destino": flujo["destino"][0],
            "puerto_destino": flujo["destino"][1],
            "protocolo": protocolo,
            "duracion": duracion,
            "spkts": spkts,
            "dpkts": dpkts,
            "sbytes": sbytes,
            "dbytes": dbytes,
            "rate": rate,
            "sload": sload,
            "dload": dload,
            "sinpkt": promedio_intervalos(
                flujo["tiempos_origen"]
            ),
            "dinpkt": promedio_intervalos(
                flujo["tiempos_destino"]
            ),
            "estado_tcp": (
                sesion["estado"] if sesion else None
            ),
            "synack": (
                sesion["synack_ms"] if sesion else None
            ),
            "ackdat": (
                sesion["ackdat_ms"] if sesion else None
            ),
            "tcprtt": (
                sesion["tcprtt_ms"] if sesion else None
            )
        }

        if enviar_flujo(datos):
            enviados += 1
        else:
            fallidos += 1

    print("\n========== ENVIO AL API GATEWAY ==========")
    print(f"Flujos enviados: {enviados}")
    print(f"Flujos fallidos: {fallidos}")
    print("=========================================")


def mostrar_resultados():
    print("\n" + "=" * 70)
    print("PROTECKEY | RESUMEN DE FLUJOS")
    print("=" * 70)

    for clave, flujo in flujos.items():

        protocolo = clave[0]

        duracion = max(
            0,
            flujo["ultimo"] - flujo["inicio"]
        )

        total_paquetes = (
            flujo["spkts"] + flujo["dpkts"]
        )

        rate = (
            total_paquetes / duracion
            if duracion > 0
            else None
        )

        sload = (
            flujo["sbytes"] * 8 / duracion
            if duracion > 0
            else None
        )

        dload = (
            flujo["dbytes"] * 8 / duracion
            if duracion > 0
            else None
        )

        sinpkt = promedio_intervalos(
            flujo["tiempos_origen"]
        )

        dinpkt = promedio_intervalos(
            flujo["tiempos_destino"]
        )

        fecha = datetime.fromtimestamp(
            flujo["inicio"]
        ).strftime("%Y-%m-%d %H:%M:%S")

        print("\n" + "-" * 70)

        print(
            f"ConexiÃ³n: {flujo['origen']} "
            f"<-> {flujo['destino']}"
        )

        print(f"Protocolo: {protocolo}")
        print(f"Inicio: {fecha}")
        print(f"DuraciÃ³n: {duracion:.3f} s")

        print(f"spkts: {flujo['spkts']}")
        print(f"dpkts: {flujo['dpkts']}")
        print(f"sbytes: {flujo['sbytes']}")
        print(f"dbytes: {flujo['dbytes']}")

        print(f"Total paquetes: {total_paquetes}")

        print(
            f"rate: {mostrar_valor(rate, 2)} paquetes/s"
        )

        print(
            f"sload: {mostrar_valor(sload, 2)} bits/s"
        )

        print(
            f"dload: {mostrar_valor(dload, 2)} bits/s"
        )

        print(
            f"sinpkt: {mostrar_valor(sinpkt)} ms"
        )

        print(
            f"dinpkt: {mostrar_valor(dinpkt)} ms"
        )

        if protocolo == "tcp":

            banderas = "".join(
                sorted(flujo["banderas_tcp"])
            ) or "N/D"

            print(f"Banderas TCP: {banderas}")

            sesion = sesiones_tcp.get(clave)

            if sesion is None:
                print("Establecimiento: no observado")
                continue

            print(
                f"Estado TCP observado: "
                f"{sesion['estado']}"
            )

            print(
                f"Retransmisiones SYN observadas: "
                f"{sesion['retransmisiones_syn']}"
            )

            print(
                f"synack: "
                f"{mostrar_valor(sesion['synack_ms'])} ms"
            )

            print(
                f"ackdat: "
                f"{mostrar_valor(sesion['ackdat_ms'])} ms"
            )

            print(
                f"tcprtt: "
                f"{mostrar_valor(sesion['tcprtt_ms'])} ms"
            )

    validadas = sum(
        1
        for sesion in sesiones_tcp.values()
        if sesion["estado"] == "ESTABLECIDA"
    )

    print("\n" + "=" * 70)
    print(f"Total de flujos: {len(flujos)}")
    print(f"Sesiones TCP iniciadas: {len(sesiones_tcp)}")
    print(f"Sesiones TCP validadas: {validadas}")
    print("Monitoreo finalizado.")
    print("=" * 70)



def main():
    print("=" * 50)
    print("PROTECKEY - MONITOREO CONTINUO")
    print("=" * 50)
    print("Interfaz:", INTERFAZ)
    print("Intervalo de actualizaciÃ³n:", DURACION, "segundos")
    print("Monitoreo automÃ¡tico iniciado.")
    print("Para detenerlo, presiona Ctrl + C.")
    print("=" * 50)

    ciclo = 0

    try:
        while True:
            ciclo += 1

            # Reiniciar solamente los flujos de la ventana actual.
            # Las sesiones TCP deben conservarse para su asociacion ML.
            flujos.clear()

            print(f"\n[MONITOREO] Ciclo {ciclo}")
            print(f"Capturando trÃ¡fico durante {DURACION} segundos...")

            try:
                sniff(
                    iface=INTERFAZ,
                    filter="ip and (tcp or udp)",
                    prn=procesar_paquete,
                    store=False,
                    timeout=DURACION
                )

            except Exception as error:
                print(f"[ERROR] No se pudo capturar trÃ¡fico: {error}")
                break

                        # Retirar conexiones inactivas del seguimiento ML.
            tiempo_actual = time.time()

            flujos_finalizados_ml = administrador_ml.limpiar_inactivos(
                tiempo_actual
            )

            print(
                "[ML] Conexiones activas:",
                len(administrador_ml.obtener_flujos())
            )

            print(
                "[ML] Conexiones retiradas por inactividad:",
                len(flujos_finalizados_ml)
            )
            # Evaluar flujos finalizados solo en modo observacion.
            if detector_ml_experimental is not None:

                for flujo_ml in flujos_finalizados_ml:

                    try:
                        resultado_ml = (
                            detector_ml_experimental.evaluar_flujo(
                                flujo_ml
                            )
                        )

                        # Clasificar gravedad y preparar respuesta segura.
                        seguimiento_actual = seguimiento_amenazas.evaluar(resultado_ml)
                        analisis_amenaza = clasificar_amenaza(
                            resultado_ml,
                            seguimiento=seguimiento_actual
                        )

                        resultado_ml["analisis_amenaza"] = analisis_amenaza

                        # Asociar el inicio TCP con validacion temporal.
                        inicio_conexion = asociar_inicio_tcp(
                            flujo_ml,
                            sesiones_tcp,
                            ips_locales_proteckey
                        )

                        # Diagnostico temporal de asociacion TCP-ML.
                        if flujo_ml.protocolo == "tcp":
                            clave_diagnostico = (
                                "tcp",
                                tuple(sorted((
                                    flujo_ml.origen,
                                    flujo_ml.destino
                                )))
                            )

                            sesion_diagnostico = sesiones_tcp.get(
                                clave_diagnostico
                            )

                            print(
                                "[TCP-ML DIAGNOSTICO]",
                                "Sesiones:", len(sesiones_tcp),
                                "| Sesion encontrada:",
                                sesion_diagnostico is not None,
                                "| Inicio flujo:",
                                round(flujo_ml.inicio, 2),
                                "| SYN:",
                                (
                                    sesion_diagnostico.get("tiempo_syn")
                                    if sesion_diagnostico else None
                                ),
                                "| Motivo:",
                                inicio_conexion["motivo"]
                            )


                        analisis_amenaza["inicio_conexion"] = inicio_conexion

                        print(
                            "[PROTECKEY CONEXION]",
                            "Inicio:", inicio_conexion["inicio"],
                            "| Estado TCP:",
                            inicio_conexion["estado_tcp"]
                        )



                        # Registrar la decision de proteccion.
                        try:
                            decision_proteccion = construir_decision(
                                analisis_amenaza
                            )

                            ruta_auditoria = registrar_decision(
                                decision_proteccion
                            )

                            # Incorporar la decision al analisis.
                            analisis_amenaza["decision_proteccion"] = (
                                decision_proteccion
                            )

                            print(
                                "[PROTECKEY AUDITORIA]",
                                "Decision:",
                                decision_proteccion["decision"],
                                "| IP:",
                                decision_proteccion["ip_origen"]
                            )

                        except Exception as error:
                            print(
                                "[PROTECKEY AUDITORIA] Error:",
                                type(error).__name__
                            )

                        print(
                            "[PROTECKEY PROTECCION]",
                            "Gravedad:",
                            analisis_amenaza["gravedad"].upper(),
                            "| Modo:",
                            analisis_amenaza["modo"],
                            "| Bloqueo autorizado:",
                            analisis_amenaza["bloqueo_autorizado"]
                        )
                        # Guardar el resultado experimental en CSV.
                        try:
                            ruta_registro = guardar_prediccion_ml(
                                resultado_ml
                            )

                            print(
                                "[ML REGISTRO] Prediccion guardada en:",
                                ruta_registro
                            )

                        except Exception as error:
                            print(
                                "[ML REGISTRO] No se pudo guardar:",
                                error
                            )

                        # Enviar tambien la prediccion a PostgreSQL.
                        try:
                            enviado_db = enviar_prediccion_ml(resultado_ml)
                            if not enviado_db:
                                print('[ML API] Pendiente de almacenar en PostgreSQL.')
                        except Exception as error:
                            print('[ML API] Error de envio:', type(error).__name__)

                        # Alerta experimental de Windows.
                        try:
                            notificar_prediccion_ml(resultado_ml)
                        except Exception as error:
                            print("[ML ALERTA] Error:", type(error).__name__)

                        probabilidad = (
                            resultado_ml["probabilidad_ataque"] * 100
                        )

                        print(
                            "[ML EXPERIMENTAL]",
                            resultado_ml["protocolo"].upper(),
                            resultado_ml["origen"],
                            "->",
                            resultado_ml["destino"],
                            "| Prediccion:",
                            resultado_ml["prediccion"],
                            "| Probabilidad:",
                            f"{probabilidad:.2f}%"
                        )

                    except Exception as error:
                        print(
                            "[ML] Error al evaluar una conexion:",
                            error
                        )
            

            # Limpiar sesiones TCP despues de evaluar los flujos ML.
            try:
                limpieza_tcp = limpiar_sesiones_tcp(
                    sesiones_tcp,
                    administrador_ml
                )

                print(
                    "[PROTECKEY TCP]",
                    "Sesiones eliminadas:",
                    limpieza_tcp["eliminadas"],
                    "| Conservadas:",
                    limpieza_tcp["conservadas"]
                )

            except Exception as error:
                print(
                    "[PROTECKEY TCP] Error de limpieza:",
                    type(error).__name__
                )

            # Enviar automÃ¡ticamente las estadÃ­sticas.
            print(f"[MONITOREO] Flujos capturados: {len(flujos)}")

            if flujos:
                enviar_resultados_api()
            else:
                print("[MONITOREO] Sin trÃ¡fico en este intervalo.")

            print("[MONITOREO] Iniciando siguiente captura...")

    except KeyboardInterrupt:
        print("\n[MONITOREO] Solicitud de detenciÃ³n recibida.")

    finally:
        print("=" * 50)
        print("PROTECKEY - MONITOREO FINALIZADO")
        print("=" * 50)


if __name__ == "__main__":
    main()
