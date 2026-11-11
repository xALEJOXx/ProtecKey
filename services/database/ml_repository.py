import json

from services.database.connection import obtener_conexion


def guardar_prediccion_ml_db(resultado):
    """Guarda una prediccion experimental en PostgreSQL."""

    conexion = obtener_conexion()
    cursor = None

    try:
        cursor = conexion.cursor()

        origen = resultado.get("origen") or ("", None)
        destino = resultado.get("destino") or ("", None)

        cursor.execute(
            """
            INSERT INTO predicciones_ml (
                protocolo,
                ip_origen,
                puerto_origen,
                ip_destino,
                puerto_destino,
                prediccion,
                probabilidad_ataque,
                caracteristicas,
                estado_tcp_info,
                analisis_amenaza,
                experimental
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
            RETURNING id, fecha_hora;
            """,
            (
                resultado.get("protocolo"),
                origen[0],
                origen[1],
                destino[0],
                destino[1],
                int(resultado["prediccion"]),
                float(resultado["probabilidad_ataque"]),
                json.dumps(resultado.get("caracteristicas") or {}),
                json.dumps(resultado.get("estado_tcp_info") or {}),
                json.dumps(resultado.get("analisis_amenaza") or {}),
                bool(resultado.get("experimental", True))
            )
        )

        fila = cursor.fetchone()
        conexion.commit()

        return {
            "id": fila[0],
            "fecha_hora": fila[1].isoformat()
        }

    except Exception:
        conexion.rollback()
        raise

    finally:
        if cursor is not None:
            cursor.close()
        conexion.close()


def obtener_historial_ml(limite=20, pagina=1):
    """Consulta las predicciones con paginacion."""

    limite = max(1, min(int(limite), 100))
    pagina = max(1, int(pagina))
    desplazamiento = (pagina - 1) * limite

    conexion = obtener_conexion()
    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("SELECT COUNT(*) FROM predicciones_ml;")
        total = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT
                id,
                fecha_hora,
                protocolo,
                ip_origen,
                puerto_origen,
                ip_destino,
                puerto_destino,
                prediccion,
                probabilidad_ataque,
                experimental, analisis_amenaza
            FROM predicciones_ml
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
                "protocolo": fila[2],
                "ip_origen": fila[3],
                "puerto_origen": fila[4],
                "ip_destino": fila[5],
                "puerto_destino": fila[6],
                "prediccion": fila[7],
                "probabilidad_ataque": fila[8],
                "experimental": fila[9],
                "analisis_amenaza": fila[10]
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


def obtener_detalle_ml(prediccion_id):
    """Obtiene una prediccion completa desde PostgreSQL."""
    from services.database.connection import obtener_conexion

    consulta = """
        SELECT
            id,
            fecha_hora,
            protocolo,
            ip_origen,
            puerto_origen,
            ip_destino,
            puerto_destino,
            prediccion,
            probabilidad_ataque,
            caracteristicas,
            estado_tcp_info,
            experimental, analisis_amenaza
        FROM predicciones_ml
        WHERE id = %s
    """

    conexion = obtener_conexion()

    try:
        with conexion.cursor() as cursor:
            cursor.execute(consulta, (prediccion_id,))
            fila = cursor.fetchone()

        if fila is None:
            return None

        return {
            "id": fila[0],
            "fecha_hora": fila[1].isoformat(),
            "protocolo": fila[2],
            "ip_origen": fila[3],
            "puerto_origen": fila[4],
            "ip_destino": fila[5],
            "puerto_destino": fila[6],
            "prediccion": fila[7],
            "probabilidad_ataque": fila[8],
            "caracteristicas": fila[9],
            "estado_tcp_info": fila[10],
            "experimental": fila[11],
            "analisis_amenaza": fila[12]
        }

    finally:
        conexion.close()

def obtener_estadisticas_ml():
    """Resumen agregado de predicciones ML registradas."""
    conexion = obtener_conexion()

    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (
                        WHERE prediccion = 0
                    ) AS normales,
                    COUNT(*) FILTER (
                        WHERE prediccion = 1
                    ) AS sospechosas,
                    COUNT(*) FILTER (
                        WHERE LOWER(
                            COALESCE(
                                analisis_amenaza->>'gravedad',
                                ''
                            )
                        ) IN ('alta', 'alto', 'critica', 'critico')
                    ) AS gravedad_alta
                FROM predicciones_ml;
            """)

            fila = cursor.fetchone()

        return {
            "total": fila[0],
            "normales": fila[1],
            "sospechosas": fila[2],
            "gravedad_alta": fila[3]
        }

    finally:
        conexion.close()
