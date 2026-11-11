import base64
import hashlib
import hmac
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CREDENTIAL_FILE = BASE_DIR / ".env.monitor-operator"


def verificar_clave_operador(password: str) -> bool:
    if not isinstance(password, str) or not password:
        return False

    if not CREDENTIAL_FILE.is_file():
        return False

    try:
        config = json.loads(
            CREDENTIAL_FILE.read_text(encoding="utf-8")
        )

        if config.get("algorithm") != "pbkdf2_sha256":
            return False

        iterations = int(config["iterations"])

        if iterations < 600_000:
            return False

        salt = base64.b64decode(
            config["salt"],
            validate=True
        )

        expected_hash = base64.b64decode(
            config["hash"],
            validate=True
        )

        calculated_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            iterations
        )

        return hmac.compare_digest(
            calculated_hash,
            expected_hash
        )

    except (OSError, ValueError, KeyError, TypeError):
        return False
