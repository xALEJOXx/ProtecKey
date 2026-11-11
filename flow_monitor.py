
from scapy.all import sniff, IP, TCP, UDP
from datetime import datetime

# ==================================================
# PROTECKEY - MONITOR DE TRAFICO DE RED
# ==================================================

# Diccionario para almacenar los flujos detectados
flujos = {}


def promedio_intervalos(tiempos):
    """
    Calcula el tiempo promedio entre paquetes
    en milisegundos.
    """
    if len(tiempos) < 2:
        return None

    diferencias = [
        tiempos[i] - tiempos[i - 1]
        for i in range(1, len(tiempos))
    ]

    return (sum(diferencias) / len(diferencias)) * 1000


def procesar_paquete(paquete):
    """
    Analiza cada paquete capturado y actualiza
    las estadísticas de su conexión.
    """

    # Procesar solamente paquetes IPv4
    if IP not in paquete:
        return

    ip_origen = paquete[IP].src
    ip_destino = paquete[IP].dst

    # ----------------------------------------------
    # IDENTIFICAR PROTOCOLO Y BANDERAS TCP
    # ----------------------------------------------

    if TCP in paquete:
        protocolo = "tcp"
        puerto_origen = paquete[TCP].sport
        puerto_destino = paquete[TCP].dport

        # Obtener las banderas TCP
        banderas_tcp = str(paquete[TCP].flags)

        # Mostrar SYN, FIN y RST
        if any(
            bandera in banderas_tcp
            for bandera in ["S", "F", "R"]
        ):
            print(
                f"[TCP] {ip_origen}:{puerto_origen} -> "
                f"{ip_destino}:{puerto_destino} | "
                f"Banderas: {banderas_tcp}"
            )

    elif UDP in paquete:
        protocolo = "udp"
        puerto_origen = paquete[UDP].sport
        puerto_destino = paquete[UDP].dport

    else:
        return

    # ----------------------------------------------
    # IDENTIFICAR LA CONEXION
    # ----------------------------------------------

    origen = (ip_origen, puerto_origen)
    destino = (ip_destino, puerto_destino)

    # Agrupar ambos sentidos de una comunicación
    clave = (
        protocolo,
        tuple(sorted([origen, destino]))
    )

    tiempo = float(paquete.time)

    # Crear un nuevo flujo si no existe
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

    # Actualizar el tiempo del último paquete
    flujo["ultimo"] = max(flujo["ultimo"], tiempo)

    # Guardar las banderas TCP observadas
    if protocolo == "tcp":
        flujo["banderas_tcp"].update(banderas_tcp)

    # ----------------------------------------------
    # CONTAR PAQUETES Y BYTES POR DIRECCION
    # ----------------------------------------------

    if origen == flujo["origen"]:
        flujo["spkts"] += 1
        flujo["sbytes"] += len(paquete[IP])
        flujo["tiempos_origen"].append(tiempo)

    else:
        flujo["dpkts"] += 1
        flujo["dbytes"] += len(paquete[IP])
        flujo["tiempos_destino"].append(tiempo)


# ==================================================
# INICIAR CAPTURA
# ==================================================

print("\n" + "=" * 65)
print("PROTECKEY | MONITOR DE TRAFICO DE RED")
print("=" * 65)

print("Interfaz: Wi-Fi")
print("Duración de captura: 30 segundos")
print("Analizando conexiones...\n")

sniff(
    iface="Wi-Fi",
    filter="ip",
    prn=procesar_paquete,
    store=False,
    timeout=30
)


# ==================================================
# MOSTRAR RESULTADOS
# ==================================================

print("\n" + "=" * 65)
print("RESUMEN DE FLUJOS DETECTADOS")
print("=" * 65)

for clave, flujo in flujos.items():

    # Duración observada de la conexión
    duracion = max(
        0,
        flujo["ultimo"] - flujo["inicio"]
    )

    # Total de paquetes
    total_paquetes = (
        flujo["spkts"] + flujo["dpkts"]
    )

    # ----------------------------------------------
    # CALCULAR VELOCIDAD Y CARGA
    # ----------------------------------------------

    rate = (
        total_paquetes / duracion
        if duracion > 0
        else None
    )

    sload = (
        (flujo["sbytes"] * 8) / duracion
        if duracion > 0
        else None
    )

    dload = (
        (flujo["dbytes"] * 8) / duracion
        if duracion > 0
        else None
    )

    # ----------------------------------------------
    # CALCULAR INTERVALOS ENTRE PAQUETES
    # ----------------------------------------------

    sinpkt = promedio_intervalos(
        flujo["tiempos_origen"]
    )

    dinpkt = promedio_intervalos(
        flujo["tiempos_destino"]
    )

    # Fecha y hora de inicio observada
    fecha = datetime.fromtimestamp(
        flujo["inicio"]
    ).strftime("%Y-%m-%d %H:%M:%S")

    # Banderas TCP observadas
    banderas = "".join(
        sorted(flujo["banderas_tcp"])
    )

    if not banderas:
        banderas = "N/D"

    # ----------------------------------------------
    # MOSTRAR INFORMACION DEL FLUJO
    # ----------------------------------------------

    print("\n" + "-" * 65)

    print(
        f"Conexión: {flujo['origen']} "
        f"<-> {flujo['destino']}"
    )

    print(f"Protocolo: {clave[0]}")
    print(f"Inicio: {fecha}")

    print(
        f"Duración observada: {duracion:.3f} segundos"
    )

    print(
        f"Paquetes enviados (spkts): {flujo['spkts']}"
    )

    print(
        f"Paquetes recibidos (dpkts): {flujo['dpkts']}"
    )

    print(
        f"Bytes enviados (sbytes): {flujo['sbytes']}"
    )

    print(
        f"Bytes recibidos (dbytes): {flujo['dbytes']}"
    )

    print(f"Total de paquetes: {total_paquetes}")

    # Mostrar las métricas calculadas
    print(
        f"Velocidad (rate): {rate:.2f} paquetes/s"
        if rate is not None
        else "Velocidad (rate): N/D"
    )

    print(
        f"Carga origen (sload): {sload:.2f} bits/s"
        if sload is not None
        else "Carga origen (sload): N/D"
    )

    print(
        f"Carga destino (dload): {dload:.2f} bits/s"
        if dload is not None
        else "Carga destino (dload): N/D"
    )

    print(
        f"Intervalo origen (sinpkt): {sinpkt:.3f} ms"
        if sinpkt is not None
        else "Intervalo origen (sinpkt): N/D"
    )

    print(
        f"Intervalo destino (dinpkt): {dinpkt:.3f} ms"
        if dinpkt is not None
        else "Intervalo destino (dinpkt): N/D"
    )

    print(f"Banderas TCP observadas: {banderas}")


# ==================================================
# FINALIZAR MONITOREO
# ==================================================

print("\n" + "=" * 65)
print(f"Total de flujos observados: {len(flujos)}")
print("Monitoreo finalizado.")
print("=" * 65)
