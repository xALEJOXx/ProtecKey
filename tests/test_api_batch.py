import pandas as pd
import requests


# ==========================================
# 1. CARGAR DATASET
# ==========================================

test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# ==========================================
# 2. CREAR MUESTRA CONTROLADA
# ==========================================

# 50 registros normales
normales = test[
    test["label"] == 0
].head(50)

# 50 registros maliciosos
maliciosos = test[
    test["label"] == 1
].head(50)

# Unirlos
muestra = pd.concat(
    [normales, maliciosos],
    ignore_index=True
)


# ==========================================
# 3. GUARDAR LABELS REALES
# ==========================================

# Los labels se utilizarán SOLO para evaluar.
# No se envían como característica a LightGBM.
labels = (
    muestra["label"]
    .astype(int)
    .tolist()
)


# ==========================================
# 4. PREPARAR LAS 42 CARACTERÍSTICAS
# ==========================================

datos = muestra.drop(
    columns=[
        "id",
        "attack_cat",
        "label"
    ]
).to_dict(
    orient="records"
)


print("=" * 60)
print("PRUEBA API GATEWAY - ANÁLISIS POR LOTE")
print("=" * 60)

print("\nRegistros enviados:", len(datos))
print("Labels para evaluación:", len(labels))


# ==========================================
# 5. ENVIAR TODO AL API GATEWAY
# ==========================================

respuesta = requests.post(
    "http://127.0.0.1:8000/api/analyze-batch",
    json={
        "data": datos,
        "labels": labels
    },
    timeout=90
)


print("\nCódigo HTTP:", respuesta.status_code)

resultado = respuesta.json()


# ==========================================
# 6. MOSTRAR RESULTADOS
# ==========================================

if resultado.get("status") == "success":

    deteccion = resultado["detection"]

    print("\nDETECCIÓN")
    print("-" * 40)

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
        deteccion["potentially_malicious"]
    )

    print(
        "Porcentaje potencialmente malicioso:",
        deteccion["malicious_percentage"],
        "%"
    )


    # ======================================
    # EVALUACIÓN
    # ======================================

    evaluacion = resultado.get("evaluation")

    if evaluacion:

        print("\nEVALUACIÓN")
        print("-" * 40)

        matriz = evaluacion[
            "confusion_matrix"
        ]

        metricas = evaluacion[
            "metrics"
        ]

        print("\nMatriz de confusión:")

        print("TN:", matriz["TN"])
        print("FP:", matriz["FP"])
        print("FN:", matriz["FN"])
        print("TP:", matriz["TP"])

        print("\nMétricas:")

        print(
            "Accuracy:",
            metricas["accuracy"]
        )

        print(
            "Precision:",
            metricas["precision"]
        )

        print(
            "Recall:",
            metricas["recall"]
        )

        print(
            "F1:",
            metricas["f1"]
        )

        print(
            "FPR:",
            metricas["fpr"]
        )

        print(
            "FNR:",
            metricas["fnr"]
        )

    else:

        print(
            "\nNo se realizó evaluación "
            "porque no se enviaron labels."
        )

else:

    print("\nERROR")
    print(resultado)