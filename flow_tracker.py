from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FlujoPersistente:
    """Estadísticas acumuladas de una conexión de red."""

    protocolo: str
    origen: tuple
    destino: tuple
    inicio: float
    ultimo: float

    spkts: int = 0
    dpkts: int = 0
    sbytes: int = 0
    dbytes: int = 0

    primer_tiempo_origen: Optional[float] = None
    ultimo_tiempo_origen: Optional[float] = None

    primer_tiempo_destino: Optional[float] = None
    ultimo_tiempo_destino: Optional[float] = None

    estado_tcp: Optional[str] = None
    motivo_retiro: Optional[str] = None
    # Señales TCP observadas durante la captura.
    syn_observado: bool = False
    synack_observado: bool = False
    fin_observado: bool = False
    rst_observado: bool = False

    @property
    def duracion(self):
        return max(self.ultimo - self.inicio, 0)

    @property
    def total_paquetes(self):
        return self.spkts + self.dpkts

    @property
    def total_bytes(self):
        return self.sbytes + self.dbytes

    def registrar_banderas_tcp(self, banderas):
        """Conserva las banderas TCP observadas durante la conexión."""

        if self.protocolo != "tcp":
            return

        banderas = int(banderas)

        syn = bool(banderas & 0x02)
        ack = bool(banderas & 0x10)
        fin = bool(banderas & 0x01)
        rst = bool(banderas & 0x04)

        # Registrar las banderas observadas.
        if syn and not ack:
            self.syn_observado = True

        if syn and ack:
            self.synack_observado = True

        if fin:
            self.fin_observado = True

        if rst:
            self.rst_observado = True

        # Actualizar el estado a partir de todas las
        # banderas acumuladas, no solo del paquete actual.
        if self.rst_observado:
            self.estado_tcp = "RST_OBSERVADO"

        elif self.fin_observado:
            self.estado_tcp = "FIN_OBSERVADO"

        elif self.syn_observado and self.synack_observado:
            self.estado_tcp = "SYN_Y_SYNACK_OBSERVADOS"

        elif self.synack_observado:
            self.estado_tcp = "SYNACK_OBSERVADO"

        elif self.syn_observado:
            self.estado_tcp = "SYN_OBSERVADO"

    def clasificar_retiro(self):

        if self.protocolo != "tcp":
            return "INACTIVIDAD_NO_TCP"

        if self.rst_observado:
            return "INACTIVIDAD_CON_RST_OBSERVADO"

        if self.fin_observado:
            return "INACTIVIDAD_CON_FIN_OBSERVADO"

        return "INACTIVIDAD_SIN_CIERRE_OBSERVADO"

    def registrar_paquete(self, origen, tamano, tiempo):
        """
        Registra un paquete y actualiza las estadísticas
        acumuladas de la conexión.
        """

        # Actualizar los tiempos de la conexión.
        self.inicio = min(self.inicio, tiempo)
        self.ultimo = max(self.ultimo, tiempo)

        # Determinar la dirección del paquete.
        if origen == self.origen:

            self.spkts += 1
            self.sbytes += tamano

            if self.primer_tiempo_origen is None:
                self.primer_tiempo_origen = tiempo
            else:
                self.primer_tiempo_origen = min(
                    self.primer_tiempo_origen, tiempo
                )

            if self.ultimo_tiempo_origen is None:
                self.ultimo_tiempo_origen = tiempo
            else:
                self.ultimo_tiempo_origen = max(
                    self.ultimo_tiempo_origen, tiempo
                )

        elif origen == self.destino:

            self.dpkts += 1
            self.dbytes += tamano

            if self.primer_tiempo_destino is None:
                self.primer_tiempo_destino = tiempo
            else:
                self.primer_tiempo_destino = min(
                    self.primer_tiempo_destino, tiempo
                )

            if self.ultimo_tiempo_destino is None:
                self.ultimo_tiempo_destino = tiempo
            else:
                self.ultimo_tiempo_destino = max(
                    self.ultimo_tiempo_destino, tiempo
                )

        else:
            raise ValueError(
                "El paquete no pertenece a esta conexión."
            )

class AdministradorFlujos:
    """
    Administra conexiones persistentes entre ciclos de captura.
    """

    def __init__(self, tiempo_inactividad=30):
        self.flujos = {}
        self.tiempo_inactividad = tiempo_inactividad

    def registrar_paquete(
        self,
        protocolo,
        origen,
        destino,
        tamano,
        tiempo,
        banderas_tcp=None
    ):
        """
        Identifica la conexión y registra el paquete.
        """

        clave = (
            protocolo,
            tuple(sorted((origen, destino)))
        )

        # Crear la conexión si todavía no existe.
        if clave not in self.flujos:
            self.flujos[clave] = FlujoPersistente(
                protocolo=protocolo,
                origen=origen,
                destino=destino,
                inicio=tiempo,
                ultimo=tiempo
            )

        flujo = self.flujos[clave]

        # Actualizar sus estadísticas acumuladas.
        flujo.registrar_paquete(
            origen=origen,
            tamano=tamano,
            tiempo=tiempo
        )

        # Actualizar las señales TCP si están disponibles.
        if protocolo == "tcp" and banderas_tcp is not None:
            flujo.registrar_banderas_tcp(banderas_tcp)

        return flujo

    def obtener_flujos(self):
        """Devuelve las conexiones registradas."""
        return list(self.flujos.values())

    def limpiar_inactivos(self, tiempo_actual):

        eliminados = []

        for clave, flujo in list(self.flujos.items()):

            if tiempo_actual - flujo.ultimo >= self.tiempo_inactividad:

                flujo.motivo_retiro = flujo.clasificar_retiro()

                eliminados.append(flujo)

                del self.flujos[clave]

        return eliminados
