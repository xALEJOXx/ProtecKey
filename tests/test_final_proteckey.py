
import requests

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

resultados = []


def comprobar(nombre, condicion):
    estado = "APROBADO" if condicion else "FALLIDO"
    resultados.append(condicion)
    print(f"[{estado}] {nombre}")


def consultar(nombre, url):
    try:
        respuesta = requests.get(url, timeout=15)
        comprobar(nombre, respuesta.status_code == 200)
    except requests.RequestException as error:
        comprobar(nombre, False)
        print("  Error:", error)


print("=" * 55)
print("PRUEBAS FINALES DE INTEGRACION - PROTECKEY")
print("=" * 55)

# 1. API Gateway
consultar(
    "API Gateway disponible",
    f"{BASE_URL}/health"
)

# 2. Historial individual
consultar(
    "Historial individual disponible",
    f"{BASE_URL}/api/history"
)

# 3. Historial por lotes
consultar(
    "Historial por lotes disponible",
    f"{BASE_URL}/api/batch-history"
)

# 4. Frontend
consultar(
    "Frontend disponible",
    FRONTEND_URL
)

# 5. Validacion de datos invalidos
try:
    respuesta = requests.post(
        f"{BASE_URL}/api/analyze",
        json={"data": {}},
        timeout=15
    )

    contenido = respuesta.json()

    rechazado = (
        respuesta.status_code in (400, 422)
        or contenido.get("status") == "error"
    )

    comprobar(
        "Validacion de registros incompletos",
        rechazado
    )

except (requests.RequestException, ValueError) as error:
    comprobar("Validacion de registros incompletos", False)
    print("  Error:", error)


# Resumen
print("\n" + "=" * 55)
print("RESULTADO FINAL")
print("=" * 55)

aprobadas = sum(resultados)
total = len(resultados)

print(f"Pruebas aprobadas: {aprobadas}/{total}")

if aprobadas == total:
    print("RESULTADO: PRUEBAS SUPERADAS")
else:
    print("RESULTADO: EXISTEN PRUEBAS FALLIDAS")
    raise SystemExit(1)
