from pathlib import Path

import pandas as pd
import joblib

from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)

# Rutas del proyecto.
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "ml"
MODELOS_DIR = BASE_DIR / "models"

# Características que utiliza ProtecKey.
CARACTERISTICAS = [
    "dur",
    "proto",
    "spkts",
    "dpkts",
    "sbytes",
    "dbytes",
    "rate",
    "sload",
    "dload",
    "sinpkt",
    "dinpkt"
]

NUMERICAS = [
    columna
    for columna in CARACTERISTICAS
    if columna != "proto"
]


def main():

    print("ENTRENAMIENTO ML - PROTECKEY")
    print("=" * 55)

    # Cargar únicamente entrenamiento y validación.
    train = pd.read_csv(DATA_DIR / "train.csv")
    validation = pd.read_csv(DATA_DIR / "validation.csv")

    X_train = train[CARACTERISTICAS]
    y_train = train["label"]

    X_val = validation[CARACTERISTICAS]
    y_val = validation["label"]

    print("\nRegistros entrenamiento:", len(train))
    print("Registros validacion:", len(validation))

    # Transformar el protocolo TCP/UDP a formato numérico.
    preprocesador = ColumnTransformer(
        transformers=[
            ("numericas", "passthrough", NUMERICAS),
            (
                "protocolo",
                OneHotEncoder(handle_unknown="ignore"),
                ["proto"]
            )
        ]
    )

    # Modelo independiente del detector actual.
    clasificador = LGBMClassifier(
        n_estimators=200,
        learning_rate=0.05,
        num_leaves=31,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
        verbosity=-1
    )

    modelo = Pipeline([
        ("preprocesador", preprocesador),
        ("clasificador", clasificador)
    ])

    print("\nEntrenando modelo...")

    modelo.fit(X_train, y_train)

    print("Entrenamiento finalizado.")

    # Evaluar únicamente con validación.
    predicciones = modelo.predict(X_val)

    print("\nRESULTADOS DE VALIDACION")
    print("=" * 55)

    print(
        classification_report(
            y_val,
            predicciones,
            labels=[0, 1],
            target_names=["Normal", "Ataque"],
            zero_division=0
        )
    )

    print("MATRIZ DE CONFUSION")
    print(
        confusion_matrix(
            y_val,
            predicciones,
            labels=[0, 1]
        )
    )

    print("\nMETRICAS DE ATAQUES")

    print(
        "Precision:",
        round(
            precision_score(
                y_val, predicciones, zero_division=0
            ), 4
        )
    )

    print(
        "Recall:",
        round(
            recall_score(
                y_val, predicciones, zero_division=0
            ), 4
        )
    )

    print(
        "F1:",
        round(
            f1_score(
                y_val, predicciones, zero_division=0
            ), 4
        )
    )

    # Guardar sin reemplazar el modelo existente.
    MODELOS_DIR.mkdir(parents=True, exist_ok=True)

    ruta_modelo = (
        MODELOS_DIR / "modelo_proteckey_flujos_experimental.joblib"
    )

    joblib.dump(modelo, ruta_modelo)

    print("\nModelo experimental guardado en:")
    print(ruta_modelo)

    print("\nPROCESO FINALIZADO")


if __name__ == "__main__":
    main()
