from services.database.connection import obtener_conexion


def guardar_analisis_lote(
    nombre_archivo,
    total_registros,
    normales,
    maliciosos,
    porcentaje_malicioso,
    tiene_etiquetas=False,
    tn=None,
    fp=None,
    fn=None,
    tp=None,
    accuracy=None,
    precision=None,
    recall=None,
    f1=None,
    fpr=None,
    fnr=None
):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    consulta = """
        INSERT INTO analisis_lotes (
            nombre_archivo,
            total_registros,
            normales,
            maliciosos,
            porcentaje_malicioso,
            tiene_etiquetas,
            tn,
            fp,
            fn,
            tp,
            accuracy,
            precision_score,
            recall,
            f1,
            fpr,
            fnr
        )
        VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s
        )
        RETURNING id, fecha_hora;
    """

    valores = (
        nombre_archivo,
        total_registros,
        normales,
        maliciosos,
        porcentaje_malicioso,
        tiene_etiquetas,
        tn,
        fp,
        fn,
        tp,
        accuracy,
        precision,
        recall,
        f1,
        fpr,
        fnr
    )

    try:
        cursor.execute(
            consulta,
            valores
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


def obtener_analisis_lotes():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    consulta = """
        SELECT
            id,
            fecha_hora,
            nombre_archivo,
            total_registros,
            normales,
            maliciosos,
            porcentaje_malicioso,
            tiene_etiquetas,
            tn,
            fp,
            fn,
            tp,
            accuracy,
            precision_score,
            recall,
            f1,
            fpr,
            fnr
        FROM analisis_lotes
        ORDER BY fecha_hora DESC;
    """

    try:
        cursor.execute(consulta)

        columnas = [
            descripcion[0]
            for descripcion
            in cursor.description
        ]

        resultados = []

        for fila in cursor.fetchall():

            resultados.append(
                dict(zip(columnas, fila))
            )

        return resultados

    finally:
        cursor.close()
        conexion.close()