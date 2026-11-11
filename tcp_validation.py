
from scapy.all import sniff, IP, TCP
from datetime import datetime

# ================================================
# PROTECKEY - VALIDACION DE CONEXIONES TCP
# ================================================

INTERFAZ = "Wi-Fi"
DURACION = 30

conexiones = {}
completadas = 0


def analizar_paquete(paquete):
    global completadas

    if IP not in paquete or TCP not in paquete:
        return

    ip_origen = paquete[IP].src
    ip_destino = paquete[IP].dst

    tcp = paquete[TCP]

    origen = (ip_origen, int(tcp.sport))
    destino = (ip_destino, int(tcp.dport))

    clave = tuple(sorted((origen, destino)))

    tiempo = float(paquete.time)

    syn = bool(tcp.flags & 0x02)
    ack = bool(tcp.flags & 0x10)
    rst = bool(tcp.flags & 0x04)

    secuencia = int(tcp.seq)
    reconocimiento = int(tcp.ack)

    # ============================================
    # PASO 1: SYN INICIAL
    # ============================================

    if syn and not ack:

        # Si ya existe una conexión con el mismo
        # número de secuencia, es una retransmisión.
        if clave in conexiones:
            anterior = conexiones[clave]

            if (
                anterior["cliente"] == origen
                and anterior["seq_cliente"] == secuencia
            ):
                return

        # Crear o reiniciar el seguimiento.
        conexiones[clave] = {
            "cliente": origen,
            "servidor": destino,
            "seq_cliente": secuencia,
            "seq_servidor": None,
            "tiempo_syn": tiempo,
            "tiempo_synack": None,
            "tiempo_ack": None,
            "estado": "SYN_OBSERVADO"
        }

        return

    if clave not in conexiones:
        return

    conexion = conexiones[clave]

    if conexion["estado"] in (
        "ESTABLECIDA",
        "REINICIADA"
    ):
        return

    # ============================================
    # PASO 2: SYN-ACK DEL SERVIDOR
    # ============================================

    if syn and ack:

        if origen != conexion["servidor"]:
            return

        # El servidor debe reconocer el SYN
        # inicial del cliente.
        ack_esperado = (
            conexion["seq_cliente"] + 1
        ) % (2 ** 32)

        if reconocimiento != ack_esperado:
            return

        # Registrar el primer SYN-ACK válido.
        if conexion["tiempo_synack"] is None:
            conexion["seq_servidor"] = secuencia
            conexion["tiempo_synack"] = tiempo
            conexion["estado"] = "SYNACK_OBSERVADO"

        return

    # ============================================
    # PASO 3: ACK FINAL DEL CLIENTE
    # ============================================

    if rst:
        conexion["estado"] = "REINICIADA"
        return

    if not ack or syn:
        return

    if origen != conexion["cliente"]:
        return

    if conexion["estado"] != "SYNACK_OBSERVADO":
        return

    # El ACK final debe reconocer el SYN
    # del servidor.
    ack_esperado = (
        conexion["seq_servidor"] + 1
    ) % (2 ** 32)

    if reconocimiento != ack_esperado:
        return

    # El número de secuencia del cliente
    # debe corresponder al SYN inicial.
    seq_esperada = (
        conexion["seq_cliente"] + 1
    ) % (2 ** 32)

    if secuencia != seq_esperada:
        return

    if tiempo < conexion["tiempo_synack"]:
        return

    conexion["tiempo_ack"] = tiempo
    conexion["estado"] = "ESTABLECIDA"

    # ============================================
    # CALCULAR TIEMPOS
    # ============================================

    synack_ms = (
        conexion["tiempo_synack"]
        - conexion["tiempo_syn"]
    ) * 1000

    ackdat_ms = (
        conexion["tiempo_ack"]
        - conexion["tiempo_synack"]
    ) * 1000

    tcprtt_ms = synack_ms + ackdat_ms

    completadas += 1

    print("\n" + "-" * 60)
    print("CONEXION TCP VALIDADA")
    print(f"Cliente: {conexion['cliente']}")
    print(f"Servidor: {conexion['servidor']}")

    fecha = datetime.fromtimestamp(
        conexion["tiempo_syn"]
    ).strftime("%Y-%m-%d %H:%M:%S")

    print(f"Inicio: {fecha}")
    print("Secuencias TCP: verificadas")
    print(f"synack: {synack_ms:.3f} ms")
    print(f"ackdat: {ackdat_ms:.3f} ms")
    print(f"tcprtt: {tcprtt_ms:.3f} ms")
    print("-" * 60)


def main():
    print("\n" + "=" * 60)
    print("PROTECKEY | VALIDACION TCP")
    print("=" * 60)

    print(f"Interfaz: {INTERFAZ}")
    print(f"Duracion: {DURACION} segundos")
    print("Esperando conexiones nuevas...\n")

    try:
        sniff(
            iface=INTERFAZ,
            filter="tcp",
            prn=analizar_paquete,
            store=False,
            timeout=DURACION
        )

    except (PermissionError, OSError) as error:
        print(f"Error de captura: {error}")
        return

    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"Conexiones iniciadas: {len(conexiones)}")
    print(f"Conexiones validadas: {completadas}")
    print("Validacion finalizada.")


if __name__ == "__main__":
    main()
