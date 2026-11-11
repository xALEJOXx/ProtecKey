
from pathlib import Path

import joblib
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline

# Carpeta principal del proyecto
ROOT = Path(__file__).resolve().parents[1]

# Archivos de entrada y salida
DATA_PATH = ROOT / "data" / "UNSW_NB15_training-set.csv"
MODEL_PATH = ROOT / "models" / "modelo_proteckey_lightgbm_nuevo.joblib"

# Cargar los datos de entrenamiento
datos = pd.read_csv(DATA_PATH)

# Separar las características de la etiqueta
X = datos.drop(columns=["id", "attack_cat", "label"])
y = datos["label"]

# Identificar variables numéricas y categóricas
categoricas = ["proto", "service", "state"]
numericas = [col for col in X.columns if col not in categoricas]

# Preparar las transformaciones
preprocesamiento = ColumnTransformer(
    transformers=[
        ("numericas", StandardScaler(), numericas),
        (
            "categoricas",
            OneHotEncoder(handle_unknown="ignore"),
            categoricas
        )
    ]
)

# Configurar el modelo LightGBM
clasificador = LGBMClassifier(
    n_estimators=400,
    max_depth=10,
    min_child_samples=60,
    colsample_bytree=0.8,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
    verbosity=-1
)

# Crear el pipeline completo
pipeline = Pipeline([
    ("preprocesamiento", preprocesamiento),
    ("modelo", clasificador)
])

# Entrenar el modelo
print("Iniciando entrenamiento de ProtecKey...")
print(f"Registros de entrenamiento: {len(datos)}")

pipeline.fit(X, y)

# Guardar el nuevo modelo sin reemplazar el actual
joblib.dump(pipeline, MODEL_PATH)

print("\nEntrenamiento finalizado correctamente.")
print(f"Modelo guardado en: {MODEL_PATH}")
