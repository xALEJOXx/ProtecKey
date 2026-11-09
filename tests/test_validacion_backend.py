import pandas as pd
import requests

# Dirección del API Gateway
API_URL = "http://127.0.0.1:8000/api/analyze-batch"

# Cargar un archivo con un valor incorrecto
df = pd.read_csv("tests/lote_valores_invalidos.csv")

# Convertir los registros a diccionarios
registros = df.to_dict(orient="records")

# Preparar la solicitud
datos = {
    "data": registros,
    "nombre_archivo": "prueba_backend_invalida.csv"
}

print("=" * 55)
print("PRUEBA DE VALIDACIÓN DEL BACKEND")
print("=" * 55)

try:
    respuesta = requests.post(
        API_URL,
        json=datos,
        timeout=30
    )

    print("\nCódigo HTTP:", respuesta.status_code)
    print("\nRespuesta del servidor:")
    print(respuesta.text[:2000])

    if respuesta.status_code in (400, 422):
        print("\nPRUEBA SUPERADA: el backend rechazó los datos.")

    elif respuesta.status_code == 200:
        print("\nATENCIÓN: el backend aceptó datos inválidos.")

    else:
        print("\nREVISAR: se recibió un error diferente.")

except requests.RequestException as error:
    print("\nNo fue posible conectar con la API:")
    print(error)