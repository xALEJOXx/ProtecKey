# Librería utilizada para cargar el modelo exportado desde Colab.
import joblib


# Ruta donde guardamos el modelo de ProtecKey.
ruta_modelo = "models/modelo_proteckey.joblib"


# Cargamos el pipeline completo.
modelo = joblib.load(ruta_modelo)


print("Modelo cargado correctamente.")
print("\nEstructura del pipeline:")
print(modelo)


# Mostramos los nombres de los pasos del pipeline.
print("\nPasos encontrados:")
print(modelo.named_steps.keys())


# Obtenemos el preprocesador.
preprocesador = modelo.named_steps["preprocesamiento"]


# Mostramos las columnas utilizadas por cada transformación.
print("\nTransformaciones del preprocesador:")

for nombre, transformador, columnas in preprocesador.transformers_:
    print("\nTransformación:", nombre)
    print("Columnas:")
    print(columnas)