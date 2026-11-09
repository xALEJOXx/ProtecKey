import pandas as pd


test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)

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

muestra.to_csv(
    "tests/lote_prueba_100.csv",
    index=False
)

print("Archivo creado correctamente.")
print("Ruta: tests/lote_prueba_100.csv")
print("Registros:", len(muestra))
print(
    "Normales reales:",
    (muestra["label"] == 0).sum()
)
print(
    "Maliciosos reales:",
    (muestra["label"] == 1).sum()
)