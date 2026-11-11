
from scapy.all import sniff, IP, TCP, UDP
from datetime import datetime

def analizar_paquete(paquete):
    if IP not in paquete:
        return

    origen = paquete[IP].src
    destino = paquete[IP].dst

    if TCP in paquete:
        protocolo = "TCP"
        puerto_origen = paquete[TCP].sport
        puerto_destino = paquete[TCP].dport
    elif UDP in paquete:
        protocolo = "UDP"
        puerto_origen = paquete[UDP].sport
        puerto_destino = paquete[UDP].dport
    else:
        protocolo = "OTRO"
        puerto_origen = "-"
        puerto_destino = "-"

    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(
        f"[{fecha}] "
        f"{origen}:{puerto_origen} -> "
        f"{destino}:{puerto_destino} | "
        f"{protocolo} | "
        f"{len(paquete)} bytes"
    )


print("ProtecKey | Monitor de red")
print("Interfaz: Wi-Fi")
print("Capturando durante 30 segundos...\n")

sniff(
    iface="Wi-Fi",
    filter="ip",
    prn=analizar_paquete,
    store=False,
    timeout=30
)

print("\nMonitoreo finalizado.")
