from scapy.all import IP, TCP, UDP, Raw

from flow_tracker import AdministradorFlujos
from ml_features import extraer_caracteristicas


print("PRUEBA SCAPY + MACHINE LEARNING - PROTECKEY")
print("=" * 60)

administrador = AdministradorFlujos(
    tiempo_inactividad=30
)


def procesar_paquete_simulado(paquete, tiempo):

    ip = paquete[IP]

    if TCP in paquete:
        protocolo = "tcp"
        transporte = paquete[TCP]

    elif UDP in paquete:
        protocolo = "udp"
        transporte = paquete[UDP]

    else:
        return

    origen = (
        ip.src,
        transporte.sport
    )

    destino = (
        ip.dst,
        transporte.dport
    )

    tamano = len(ip)

    administrador.registrar_paquete(
        protocolo=protocolo,
        origen=origen,
        destino=destino,
        tamano=tamano,
        tiempo=tiempo
    )


# Conexión TCP de prueba.
paquetes_tcp = [
    (
        IP(src="192.168.1.10", dst="192.168.1.20")
        / TCP(sport=50000, dport=443)
        / Raw(load=b"Hola"),
        1000.0
    ),
    (
        IP(src="192.168.1.20", dst="192.168.1.10")
        / TCP(sport=443, dport=50000)
        / Raw(load=b"Respuesta"),
        1000.5
    ),
    (
        IP(src="192.168.1.10", dst="192.168.1.20")
        / TCP(sport=50000, dport=443)
        / Raw(load=b"Segundo mensaje"),
        1001.0
    )
]


# Conexión UDP de prueba.
paquetes_udp = [
    (
        IP(src="192.168.1.30", dst="192.168.1.40")
        / UDP(sport=53000, dport=9999)
        / Raw(load=b"Consulta"),
        1002.0
    ),
    (
        IP(src="192.168.1.40", dst="192.168.1.30")
        / UDP(sport=9999, dport=53000)
        / Raw(load=b"Respuesta UDP"),
        1002.2
    )
]


for paquete, tiempo in paquetes_tcp + paquetes_udp:
    procesar_paquete_simulado(paquete, tiempo)


flujos = administrador.obtener_flujos()

print("\nFLUJOS DETECTADOS:", len(flujos))

assert len(flujos) == 2, "Deben existir dos flujos"


for flujo in flujos:

    caracteristicas = extraer_caracteristicas(flujo)

    print("\nPROTOCOLO:", flujo.protocolo.upper())

    for nombre, valor in caracteristicas.items():
        print(f"{nombre}: {valor}")

    assert caracteristicas["spkts"] > 0
    assert caracteristicas["sbytes"] > 0
    assert caracteristicas["dur"] >= 0

    if flujo.protocolo == "tcp":
        assert caracteristicas["spkts"] == 2
        assert caracteristicas["dpkts"] == 1

    elif flujo.protocolo == "udp":
        assert caracteristicas["spkts"] == 1
        assert caracteristicas["dpkts"] == 1


print("\nTODAS LAS PRUEBAS SUPERADAS")
