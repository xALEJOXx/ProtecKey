from services.database.connection import obtener_conexion


def guardar_analisis(
    prediction,
    classification,
    real_label=None,
    evaluation=None
):
    """
    Guarda un análisis realizado por ProtecKey
    en PostgreSQL.
    """

    conexion = obtener_conexion()

    try:
        cursor = conexion.cursor()

        consulta = """
            INSERT INTO analisis (
                prediction,
                classification,
                real_label,
                evaluation
            )
            VALUES (%s, %s, %s, %s)
            RETURNING id, fecha_hora;
        """

        cursor.execute(
            consulta,
            (
                prediction,
                classification,
                real_label,
                evaluation
            )
        )

        resultado = cursor.fetchone()

        conexion.commit()

        return {
            "id": resultado[0],
            "fecha_hora": resultado[1]
        }

    except Exception:
        conexion.rollback()
        raise

    finally:
        cursor.close()
        conexion.close()


def obtener_historial():
    """
    Obtiene todos los análisis almacenados.
    """

    conexion = obtener_conexion()

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            SELECT
                id,
                fecha_hora,
                prediction,
                classification,
                real_label,
                evaluation
            FROM analisis
            ORDER BY id DESC;
        """)

        registros = cursor.fetchall()

        historial = []

        for registro in registros:
            historial.append({
                "id": registro[0],
                "fecha_hora": registro[1],
                "prediction": registro[2],
                "classification": registro[3],
                "real_label": registro[4],
                "evaluation": registro[5]
            })

        return historial

    finally:
        cursor.close()
        conexion.close()

def obtener_analisis_por_id(analysis_id):
    """
    Obtiene un análisis específico
    utilizando su ID.
    """

    conexion = obtener_conexion()

    try:
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT
                id,
                fecha_hora,
                prediction,
                classification,
                real_label,
                evaluation
            FROM analisis
            WHERE id = %s;
            """,
            (analysis_id,)
        )

        registro = cursor.fetchone()

        # Si no existe el ID
        if registro is None:
            return None

        return {
            "id": registro[0],
            "fecha_hora": registro[1],
            "prediction": registro[2],
            "classification": registro[3],
            "real_label": registro[4],
            "evaluation": registro[5]
        }

    finally:
        cursor.close()
        conexion.close()