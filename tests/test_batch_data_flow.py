import pandas as pd
import requests


test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# 50 normales + 50 maliciosos
normales = test[
    test["label"] == 0
].head(50)

maliciosos = test[
    test["label"] == 1
].head(50)


muestra = pd.concat(
    [normales, maliciosos],
    ignore_index=True
)


# Guardamos las etiquetas reales
labels_reales = (
    muestra["label"]
    .astype(int)
    .tolist()
)


# Datos que realmente verá LightGBM
datos_modelo = muestra.drop(
    columns=[
        "id",
        "attack_cat",
        "label"
    ]
)


registros = datos_modelo.to_dict(
    orient="records"
)


print("=" * 60)
print("PRUEBA DATA → DETECTION POR LOTE")
print("=" * 60)

print(
    "\nRegistros enviados:",
    len(registros)
)


respuesta = requests.post(
    (
        "http://127.0.0.1:8001"
        "/data/analyze-batch"
    ),
    json={
        "data": registros
    },
    timeout=60
)


print(
    "\nCódigo HTTP:",
    respuesta.status_code
)


resultado = respuesta.json()


if resultado.get("status") == "success":

    deteccion = resultado["detection"]

    print("\nVALIDACIÓN:")
    print(
        "Registros validados:",
        resultado["validation"][
            "total_validated"
        ]
    )

    print("\nDETECCIÓN:")
    print(
        "Total:",
        deteccion["total"]
    )

    print(
        "Normales:",
        deteccion["normal"]
    )

    print(
        "Potencialmente maliciosos:",
        deteccion[
            "potentially_malicious"
        ]
    )

    print(
        "Porcentaje malicioso:",
        deteccion[
            "malicious_percentage"
        ],
        "%"
    )

    predicciones = [
        registro["prediction"]
        for registro
        in deteccion["results"]
    ]

    correctos = sum(
        real == predicho
        for real, predicho in zip(
            labels_reales,
            predicciones
        )
    )

    print(
        "\nAciertos de comprobación:",
        correctos
    )

else:

    print("\nERROR:")
    print(resultado)