
def extraer_caracteristicas(flujo):
    """
    Extrae características básicas de una conexión persistente.

    Las fórmulas de carga son aproximaciones verificadas
    estadísticamente con UNSW-NB15.
    """

    duracion = flujo.duracion
    spkts = flujo.spkts
    dpkts = flujo.dpkts
    sbytes = flujo.sbytes
    dbytes = flujo.dbytes

    total_paquetes = spkts + dpkts

    # Paquetes por segundo.
    if duracion > 0:
        rate = max(total_paquetes - 1, 0) / duracion
    else:
        rate = 0.0

    # Carga de origen en bits por segundo.
    if duracion > 0 and spkts > 1:
        sload = (
            sbytes * (spkts - 1) / spkts
        ) * 8 / duracion
    else:
        sload = 0.0

    # Carga de destino en bits por segundo.
    if duracion > 0 and dpkts > 1:
        dload = (
            dbytes * (dpkts - 1) / dpkts
        ) * 8 / duracion
    else:
        dload = 0.0

    # Intervalos promedio entre paquetes, en milisegundos.
    def intervalo_promedio(primero, ultimo, cantidad):
        if cantidad < 2 or primero is None or ultimo is None:
            return 0.0

        return (
            (ultimo - primero) / (cantidad - 1)
        ) * 1000


    sinpkt = intervalo_promedio(
        flujo.primer_tiempo_origen,
        flujo.ultimo_tiempo_origen,
        flujo.spkts
    )

    dinpkt = intervalo_promedio(
        flujo.primer_tiempo_destino,
        flujo.ultimo_tiempo_destino,
        flujo.dpkts
    )

    return {
        "dur": duracion,
        "proto": flujo.protocolo,
        "spkts": spkts,
        "dpkts": dpkts,
        "sbytes": sbytes,
        "dbytes": dbytes,
        "rate": rate,
        "sload": sload,
        "dload": dload,
        "sinpkt": sinpkt,
        "dinpkt": dinpkt
    }
