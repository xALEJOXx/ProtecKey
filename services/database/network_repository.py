
from services.database.connection import obtener_conexion


def guardar_flujo(flujo):
    """
    Guarda un flujo de red capturado por ProtecKey.
    """

    conexion = obtener_conexion()
    cursor = None

    try:
        cursor = conexion.cursor()

        consulta = """
            INSERT INTO flujos_red (
                ip_origen,
                ip_destino,
                puerto_origen,
                puerto_destino,
                protocolo,
                paquetes,
                bytes,
                duracion
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, fecha_hora;
        """

        cursor.execute(
            consulta,
            (
                flujo.get("ip_origen"),
                flujo.get("ip_destino"),
                flujo.get("puerto_origen"),
                flujo.get("puerto_destino"),
                flujo.get("protocolo"),
                flujo.get("paquetes", 0),
                flujo.get("bytes", 0),
                flujo.get("duracion", 0)
            )
        )

        resultado = cursor.fetchone()
        conexion.commit()

        return {
            "id": resultado[0],
            "fecha_hora": resultado[1].isoformat()
        }

    except Exception:
        conexion.rollback()
        raise

    finally:
        if cursor is not None:
            cursor.close()
        conexion.close()


def obtener_historial_flujos(limite=50, pagina=1):
    """
    Consulta los flujos de red almacenados en PostgreSQL.
    Utiliza paginación para evitar cargar todos los registros.
    """

    limite = max(1, min(int(limite), 100))
    pagina = max(1, int(pagina))
    desplazamiento = (pagina - 1) * limite

    conexion = obtener_conexion()
    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("SELECT COUNT(*) FROM flujos_red;")
        total = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT
                id,
                fecha_hora,
                ip_origen,
                ip_destino,
                puerto_origen,
                puerto_destino,
                protocolo,
                paquetes,
                bytes,
                duracion
            FROM flujos_red
            ORDER BY id DESC
            LIMIT %s OFFSET %s;
            """,
            (limite, desplazamiento)
        )

        registros = []

        for fila in cursor.fetchall():
            registros.append({
                "id": fila[0],
                "fecha_hora": fila[1].isoformat(),
                "ip_origen": fila[2],
                "ip_destino": fila[3],
                "puerto_origen": fila[4],
                "puerto_destino": fila[5],
                "protocolo": fila[6],
                "paquetes": fila[7],
                "bytes": fila[8],
                "duracion": fila[9]
            })

        return {
            "total": total,
            "pagina": pagina,
            "limite": limite,
            "records": registros
        }

    finally:
        if cursor is not None:
            cursor.close()
        conexion.close()
