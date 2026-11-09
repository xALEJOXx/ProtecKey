from services.database.connection import obtener_conexion

print("Iniciando prueba de conexión...")

try:
    conexion = obtener_conexion()

    cursor = conexion.cursor()
    cursor.execute("SELECT version();")

    version = cursor.fetchone()

    print("=" * 50)
    print("CONEXIÓN EXITOSA")
    print("=" * 50)

    print("\nPostgreSQL:")
    print(version[0])

    cursor.close()
    conexion.close()

except Exception as error:
    print("=" * 50)
    print("ERROR DE CONEXIÓN")
    print("=" * 50)

    print(type(error).__name__)
    print(error)