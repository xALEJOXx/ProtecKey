
import os
import secrets
from fastapi import Query
from services.database.network_repository import obtener_historial_flujos
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Header,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)
from pydantic import BaseModel, Field
from fastapi.concurrency import run_in_threadpool
from services.database.network_repository import guardar_flujo

# ==============================================
# PROTECKEY - MONITOREO EN VIVO
# ==============================================

router = APIRouter()

# Clave compartida entre el monitor de Windows
# y el API Gateway.
LIVE_MONITOR_TOKEN = os.getenv("LIVE_MONITOR_TOKEN")
LIVE_HISTORY_TOKEN = os.getenv("LIVE_HISTORY_TOKEN")

# Clientes WebSocket conectados.
clientes = set()


# ==============================================
# ESTRUCTURA DE LOS DATOS RECIBIDOS
# ==============================================

class FlujoRed(BaseModel):
    ip_origen: str
    puerto_origen: int = Field(ge=0, le=65535)
    ip_destino: str
    puerto_destino: int = Field(ge=0, le=65535)

    protocolo: str
    duracion: float = Field(ge=0)

    spkts: int = Field(ge=0)
    dpkts: int = Field(ge=0)
    sbytes: int = Field(ge=0)
    dbytes: int = Field(ge=0)

    rate: float | None = Field(default=None, ge=0)
    sload: float | None = Field(default=None, ge=0)
    dload: float | None = Field(default=None, ge=0)

    sinpkt: float | None = Field(default=None, ge=0)
    dinpkt: float | None = Field(default=None, ge=0)

    estado_tcp: str | None = None
    synack: float | None = Field(default=None, ge=0)
    ackdat: float | None = Field(default=None, ge=0)
    tcprtt: float | None = Field(default=None, ge=0)


# ==============================================
# RECIBIR ESTADISTICAS DESDE WINDOWS
# ==============================================

@router.post("/api/live/flows")
async def recibir_flujo(
    flujo: FlujoRed,
    x_monitor_token: str | None = Header(default=None)
):

    if not LIVE_MONITOR_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="El monitor no estÃ¡ configurado."
        )

    if not x_monitor_token or not secrets.compare_digest(
        x_monitor_token,
        LIVE_MONITOR_TOKEN
    ):
        raise HTTPException(
            status_code=401,
            detail="Monitor no autorizado."
        )


    # Preparar los datos para PostgreSQL.
    datos_guardar = {
        "ip_origen": flujo.ip_origen,
        "ip_destino": flujo.ip_destino,
        "puerto_origen": flujo.puerto_origen,
        "puerto_destino": flujo.puerto_destino,
        "protocolo": flujo.protocolo,
        "paquetes": flujo.spkts + flujo.dpkts,
        "bytes": flujo.sbytes + flujo.dbytes,
        "duracion": flujo.duracion
    }

    # Guardar el flujo antes de enviarlo al frontend.
    try:
        registro = await run_in_threadpool(
            guardar_flujo,
            datos_guardar
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="No fue posible almacenar el flujo de red."
        )

    # Crear el evento para el monitoreo en vivo.
    evento = {
        "tipo": "flujo_red",
        "fecha_hora": registro["fecha_hora"],
        "datos": flujo.model_dump()
    }


    # Enviar el evento a los clientes conectados.
    desconectados = []

    for cliente in list(clientes):
        try:
            await cliente.send_json(evento)
        except Exception:
            desconectados.append(cliente)

    for cliente in desconectados:
        clientes.discard(cliente)

    return {
        "status": "received",
        "clientes_conectados": len(clientes)
    }


# ==============================================
# CONEXION WEBSOCKET DEL FRONTEND
# ==============================================

@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):

    origen = websocket.headers.get("origin")


    origenes_permitidos = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "https://declared-invitation-loose-construction.trycloudflare.com"
    }

    if origen not in origenes_permitidos:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    clientes.add(websocket)

    try:
        await websocket.send_json({
            "tipo": "conexion",
            "mensaje": "Conectado al monitor de ProtecKey"
        })

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        clientes.discard(websocket)


# ==============================================
# HISTORIAL DE FLUJOS DE RED
# ==============================================

@router.get("/api/live/history")
async def consultar_historial_flujos(
    limite: int = Query(default=50, ge=1, le=100),
    pagina: int = Query(default=1, ge=1),
    x_history_token: str | None = Header(default=None)
):
    # Verificar que el servidor tenga configurada la clave.
    if not LIVE_HISTORY_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="El historial no estÃ¡ configurado."
        )

    # Comprobar que la solicitud estÃ© autorizada.
    if not x_history_token or not secrets.compare_digest(
        x_history_token,
        LIVE_HISTORY_TOKEN
    ):
        raise HTTPException(
            status_code=401,
            detail="No autorizado para consultar el historial."
        )

    # Consultar los registros almacenados en PostgreSQL.
    try:
        resultado = await run_in_threadpool(
            obtener_historial_flujos,
            limite,
            pagina
        )

        return {
            "status": "success",
            **resultado
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="No fue posible consultar el historial de monitoreo."
        )
