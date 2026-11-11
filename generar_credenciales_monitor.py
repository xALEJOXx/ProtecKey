from pathlib import Path
import base64
import hashlib
import json
import secrets

ROOT = Path(__file__).resolve().parent
CONTROL = ROOT / ".env.monitor-control"
OPERATOR = ROOT / ".env.monitor-operator"

if CONTROL.exists() or OPERATOR.exists():
    print("Ya existen credenciales del monitor.")
    print("No se modifico ningun archivo.")
    raise SystemExit(1)

password = secrets.token_urlsafe(18)
control_token = secrets.token_urlsafe(48)
salt = secrets.token_bytes(32)
iterations = 310000

password_hash = hashlib.pbkdf2_hmac(
    "sha256",
    password.encode("utf-8"),
    salt,
    iterations
)

operator_config = {
    "algorithm": "pbkdf2_sha256",
    "iterations": iterations,
    "salt": base64.b64encode(salt).decode(),
    "hash": base64.b64encode(password_hash).decode()
}

try:
    with CONTROL.open("x", encoding="utf-8") as file:
        file.write(control_token)

    with OPERATOR.open("x", encoding="utf-8") as file:
        json.dump(operator_config, file, indent=2)

except Exception:
    CONTROL.unlink(missing_ok=True)
    OPERATOR.unlink(missing_ok=True)
    raise

print("Credenciales generadas correctamente.")
print("Contrasena del operador:", password)
print("Guarda la contrasena en un lugar privado.")
print("No compartas esta salida.")
