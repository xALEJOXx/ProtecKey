from flow_tracker import AdministradorFlujos
from ml_features import extraer_caracteristicas

print("PRUEBA DE FLUJOS ML - PROTECKEY")
print("=" * 55)

administrador = AdministradorFlujos(
    tiempo_inactividad=30
)

origen = ("192.168.1.10", 50000)
destino = ("192.168.1.20", 443)

paquetes = [
    (origen, destino, 100, 1000.0),
    (destino, origen, 200, 1000.5),
    (origen, destino, 150, 1001.0),
    (destino, origen, 300, 1002.0),
]

for src, dst, tamano, tiempo in paquetes:

    administrador.registrar_paquete(
        protocolo="tcp",
        origen=src,
        destino=dst,
        tamano=tamano,
        tiempo=tiempo
    )

flujos = administrador.obtener_flujos()

assert len(flujos) == 1, "Debe existir un flujo"

flujo = flujos[0]

caracteristicas = extraer_caracteristicas(flujo)

print("\nCARACTERISTICAS EXTRAIDAS")

for nombre, valor in caracteristicas.items():
    print(f"{nombre}: {valor}")

assert caracteristicas["spkts"] == 2
assert caracteristicas["dpkts"] == 2
assert caracteristicas["sbytes"] == 250
assert caracteristicas["dbytes"] == 500
assert caracteristicas["dur"] == 2.0
assert caracteristicas["sinpkt"] == 1000.0
assert caracteristicas["dinpkt"] == 1500.0

print("\nPRUEBA DE INACTIVIDAD")

eliminados = administrador.limpiar_inactivos(
    tiempo_actual=1033.0
)

assert len(eliminados) == 1
assert len(administrador.obtener_flujos()) == 0

print("Flujos eliminados:", len(eliminados))

print("\nTODAS LAS PRUEBAS SUPERADAS")
