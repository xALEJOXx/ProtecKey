from services.database.batch_repository import (
    guardar_analisis_lote,
    obtener_analisis_lotes
)


print("=" * 60)
print("PRUEBA POSTGRESQL - ANÁLISIS POR LOTES")
print("=" * 60)


# ==========================================
# GUARDAR UN LOTE DE PRUEBA
# ==========================================

resultado = guardar_analisis_lote(
    nombre_archivo="lote_prueba_100.csv",

    total_registros=100,
    normales=31,
    maliciosos=69,
    porcentaje_malicioso=69.0,

    tiene_etiquetas=True,

    tn=22,
    fp=28,
    fn=9,
    tp=41,

    accuracy=0.63,
    precision=0.5942,
    recall=0.82,
    f1=0.6891,
    fpr=0.56,
    fnr=0.18
)


print("\nLOTE GUARDADO")
print("ID:", resultado["id"])
print(
    "Fecha:",
    resultado["fecha_hora"]
)


# ==========================================
# CONSULTAR HISTORIAL
# ==========================================

historial = obtener_analisis_lotes()


print(
    "\nLotes almacenados:",
    len(historial)
)


print("\nÚLTIMO LOTE:")

ultimo = historial[0]

for clave, valor in ultimo.items():
    print(
        f"{clave}: {valor}"
    )