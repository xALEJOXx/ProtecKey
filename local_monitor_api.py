import os
import secrets
import time
from collections import deque
from threading import Lock

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from monitor_auth import verificar_clave_operador
from monitor_controller import (
    iniciar_monitor,
    detener_monitor,
    estado_monitor
)

app = FastAPI(
    title="ProtecKey - Controlador local",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

CONTROL_TOKEN = os.environ.get("PROTECKEY_CONTROL_TOKEN")

SESSION_DURATION = 1800
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW = 300

sessions = {}
failed_attempts = deque()
auth_lock = Lock()


class ControlResponse(BaseModel):
    estado: str
    mensaje: str | None = None
    pid: int | None = None


class LoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=256)


def verificar_autorizacion(token: str | None):
    if not CONTROL_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="El controlador local no tiene una clave configurada."
        )

    if not token or not secrets.compare_digest(token, CONTROL_TOKEN):
        raise HTTPException(
            status_code=401,
            detail="No autorizado."
        )


def verificar_sesion(token: str | None):
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión."
        )

    with auth_lock:
        ahora = time.monotonic()

        for clave, expiracion in list(sessions.items()):
            if expiracion <= ahora:
                del sessions[clave]

        for clave, expiracion in sessions.items():
            if secrets.compare_digest(token, clave):
                if expiracion > ahora:
                    return

    raise HTTPException(
        status_code=401,
        detail="Sesión inválida o vencida."
    )


@app.post("/local/login")
def login(datos: LoginRequest):
    ahora = time.monotonic()

    with auth_lock:
        while failed_attempts and ahora - failed_attempts[0] > ATTEMPT_WINDOW:
            failed_attempts.popleft()

        if len(failed_attempts) >= MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos. Espera cinco minutos."
            )

        if not verificar_clave_operador(datos.password):
            failed_attempts.append(time.monotonic())
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas."
            )

        failed_attempts.clear()

        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = time.monotonic() + SESSION_DURATION

    return {
        "session_token": session_token,
        "expires_in": SESSION_DURATION
    }


@app.post("/local/logout")
def logout(x_session_token: str | None = Header(default=None)):
    verificar_sesion(x_session_token)

    with auth_lock:
        for clave in list(sessions):
            if secrets.compare_digest(clave, x_session_token):
                del sessions[clave]

    return {"mensaje": "Sesión cerrada."}


@app.get("/local/status")
def consultar_estado(
    x_control_token: str | None = Header(default=None)
):
    verificar_autorizacion(x_control_token)
    return estado_monitor()


@app.post("/local/start")
def iniciar(
    x_control_token: str | None = Header(default=None)
):
    verificar_autorizacion(x_control_token)
    return iniciar_monitor()


@app.post("/local/stop")
def detener(
    x_control_token: str | None = Header(default=None)
):
    verificar_autorizacion(x_control_token)
    return detener_monitor()
