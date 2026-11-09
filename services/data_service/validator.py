import math


def validar_entrada(
    datos: dict,
    columnas_requeridas: list,
    columnas_numericas: list,
    columnas_categoricas: list
):
    """
    Valida la estructura y los tipos de datos
    recibidos por ProtecKey.
    """

    errores = []

    columnas_recibidas = set(datos.keys())
    columnas_esperadas = set(columnas_requeridas)

    # 1. Identificar columnas faltantes y adicionales.
    faltantes = columnas_esperadas - columnas_recibidas
    adicionales = columnas_recibidas - columnas_esperadas

    if faltantes:
        errores.append("Faltan características requeridas.")

    if not faltantes:

        # 2. Comprobar valores nulos.
        for columna in columnas_requeridas:

            if datos[columna] is None:
                errores.append(
                    f"El campo '{columna}' no puede ser nulo."
                )

        # 3. Validar variables numéricas.
        for columna in columnas_numericas:

            valor = datos[columna]

            # Rechazar booleanos y valores nulos.
            if isinstance(valor, bool) or valor is None:
                errores.append(
                    f"El campo '{columna}' debe ser numérico."
                )
                continue

            # Aceptar números y cadenas convertibles a números.
            try:
                numero = float(valor)

                if not math.isfinite(numero):
                    errores.append(
                        f"El campo '{columna}' debe contener "
                        "un número finito."
                    )

            except (ValueError, TypeError, OverflowError):
                errores.append(
                    f"El campo '{columna}' debe ser numérico."
                )

        # 4. Validar variables categóricas.
        for columna in columnas_categoricas:

            valor = datos[columna]

            if not isinstance(valor, str):
                errores.append(
                    f"El campo '{columna}' debe ser texto."
                )

            elif not valor.strip():
                errores.append(
                    f"El campo '{columna}' no puede estar vacío."
                )

    # 5. Devolver resultado.
    if errores:
        return {
            "valido": False,
            "mensaje": "La entrada contiene errores.",
            "errores": errores,
            "faltantes": sorted(list(faltantes)),
            "adicionales": sorted(list(adicionales))
        }

    return {
        "valido": True,
        "mensaje": "Los datos son válidos para ser procesados.",
        "errores": [],
        "faltantes": [],
        "adicionales": sorted(list(adicionales))
    }