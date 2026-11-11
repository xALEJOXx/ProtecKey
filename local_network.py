import json
import subprocess
import ipaddress


def obtener_ips_locales():
    """
    Obtiene direcciones IP asignadas al equipo Windows.
    No modifica configuraciones de red.
    """

    ips = {"127.0.0.1", "::1"}

    comando = [
        "powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        (
            "Get-NetIPAddress | "
            "Where-Object { $_.AddressState -eq 'Preferred' } | "
            "Select-Object -ExpandProperty IPAddress | "
            "ConvertTo-Json -Compress"
        )
    ]

    try:
        resultado = subprocess.run(
            comando,
            capture_output=True,
            text=True,
            timeout=15,
            check=True
        )

        contenido = resultado.stdout.strip()

        if not contenido:
            return sorted(ips)

        direcciones = json.loads(contenido)

        if isinstance(direcciones, str):
            direcciones = [direcciones]

        for direccion in direcciones:
            try:
                ips.add(str(ipaddress.ip_address(direccion)))
            except ValueError:
                continue

    except (
        subprocess.SubprocessError,
        OSError,
        ValueError,
        TypeError
    ):
        pass

    return sorted(ips)


if __name__ == "__main__":
    print("=== IP LOCALES DE PROTECKEY ===")

    for ip in obtener_ips_locales():
        print(ip)
