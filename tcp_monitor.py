
from scapy.all import sniff, IP, TCP
from datetime import datetime

# Guarda las conexiones TCP observadas
conexiones = {}


def analizar_tcp(paquete):
    if IP not in paquete or TCP not in paquete:
        return

    ip_origen = paquete[IP].src
    ip_destino = paquete[IP].dst

    puerto_origen = paquete[TCP].sport
    puerto_destino = paquete[TCP].dport

    banderas = str(paquete[TCP].flags)
    tiempo = float(paquete.time)

    origen = (ip_origen, puerto_origen)
    destino = (ip_destino, puerto_destino)

    clave = tuple(sorted([origen, destino]))

    # Solo comenzar a seguir conexiones nuevas
    # cuando se observe un SYN sin ACK.
    if clave not in conexiones:
        if "S" not in banderas or "A" in banderas:
            return

        conexiones[clave] = {
            "cliente": origen,
            "servidor": destino,
            "syn": tiempo,
            "synack": None,
            "ack": None
        }

    conexion = conexiones[clave]

    # SYN inicial del cliente
    if banderas == "S" and origen == conexion["cliente"]:
        conexion["syn"] = tiempo

    # SYN-ACK del servidor
    elif (
        "S" in banderas
        and "A" in banderas
        and origen == conexion["servidor"]
    ):
        if conexion["synack"] is None:
            conexion["synack"] = tiempo

    # ACK final del establecimiento
    elif (
        banderas == "A"
        and origen == conexion["cliente"]
        and conexion["synack"] is not None
        and conexion["ack"] is None
    ):
        conexion["ack"] = tiempo

        synack = (
            conexion["synack"] - conexion["syn"]
        ) * 1000

        ackdat = (
            conexion["ack"] - conexion["synack"]
        ) * 1000

        tcprtt = synack + ackdat

        print("\nCONEXION TCP ESTABLECIDA")
        print(f"Cliente: {conexion['cliente']}")
        print(f"Servidor: {conexion['servidor']}")
        print(f"Fecha: {datetime.fromtimestamp(tiempo)}")
        print(f"synack: {synack:.3f} ms")
        print(f"ackdat: {ackdat:.3f} ms")
        print(f"tcprtt: {tcprtt:.3f} ms")
        print("-" * 55)


print("\nPROTECKEY | ANALISIS TCP")
print("Interfaz: Wi-Fi")
print("Capturando conexiones TCP durante 30 segundos...\n")

sniff(
    iface="Wi-Fi",
    filter="tcp",
    prn=analizar_tcp,
    store=False,
    timeout=30
)

print("\nMonitoreo TCP finalizado.")
print(f"Conexiones iniciadas observadas: {len(conexiones)}")
