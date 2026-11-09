import pandas as pd
import requests


# ============================================
# CONFIGURACIÓN
# ============================================

DATA_SERVICE_URL = (
    "http://127.0.0.1:8001/data/analyze"
)

EVALUATION_SERVICE_URL = (
    "http://127.0.0.1:8003/evaluation/metrics"
)


# ============================================
# CARGAR DATASET DE PRUEBA
# ============================================

test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# ============================================
# SELECCIONAR REGISTROS
# ============================================

# Tomamos registros normales y maliciosos
# para que la prueba tenga ambas clases.

normales = test[
    test["label"] == 0
].head(50)

maliciosos = test[
    test["label"] == 1
].head(50)

muestra = pd.concat(
    [normales, maliciosos]
)

# Mezclamos los registros
muestra = muestra.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


print(
    "Registros que se evaluarán:",
    len(muestra)
)


# Aquí guardaremos real + predicción
resultados_evaluacion = []


# ============================================
# DATA SERVICE + DETECTION SERVICE
# ============================================

for indice, fila in muestra.iterrows():

    # Información utilizada únicamente
    # para comprobar posteriormente el resultado.
    valor_real = int(fila["label"])

    # Estas columnas NO entran al modelo.
    datos_modelo = fila.drop(
        labels=[
            "id",
            "attack_cat",
            "label"
        ]
    ).to_dict()

    try:

        respuesta = requests.post(
            DATA_SERVICE_URL,
            json={
                "data": datos_modelo
            },
            timeout=15
        )

        respuesta.raise_for_status()

        resultado = respuesta.json()

        if resultado.get("status") != "success":
            print(
                f"Registro {indice}: "
                "falló la validación."
            )
            continue

        prediccion = int(
            resultado["detection"]["prediction"]
        )

        resultados_evaluacion.append({
            "real": valor_real,
            "prediction": prediccion
        })

    except requests.RequestException as error:

        print(
            f"Error en registro {indice}:",
            error
        )


# ============================================
# EVALUATION SERVICE
# ============================================

print(
    "\nRegistros procesados correctamente:",
    len(resultados_evaluacion)
)

if len(resultados_evaluacion) == 0:

    print(
        "No existen resultados para evaluar."
    )

else:

    respuesta_evaluacion = requests.post(
        EVALUATION_SERVICE_URL,
        json={
            "results": resultados_evaluacion
        },
        timeout=15
    )

    print(
        "\nCódigo Evaluation Service:",
        respuesta_evaluacion.status_code
    )

    print(
        "\nRESULTADO FINAL:"
    )

    print(
        respuesta_evaluacion.json()
    )