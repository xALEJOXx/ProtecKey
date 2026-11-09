from services.database.analysis_repository import (
    guardar_analisis,
    obtener_historial
)


print("Guardando análisis de prueba...")


resultado = guardar_analisis(
    prediction=1,
    classification="Potencialmente malicioso",
    real_label=1,
    evaluation="TP"
)


print("\nREGISTRO GUARDADO")
print("ID:", resultado["id"])
print("Fecha:", resultado["fecha_hora"])


print("\nHISTORIAL:")

historial = obtener_historial()

for registro in historial:
    print(registro)