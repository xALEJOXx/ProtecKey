import pandas as pd


# Cargar conjunto de prueba
test = pd.read_csv(
    "data/UNSW_NB15_testing-set.csv"
)


# Buscar un registro realmente malicioso
registro = test[
    test["label"] == 1
].iloc[[0]]


# Guardarlo completo.
# El frontend eliminará id, label y attack_cat
# antes de enviarlo al modelo.
registro.to_csv(
    "tests/registro_prueba.csv",
    index=False
)


print("CSV creado correctamente.")
print("Archivo: tests/registro_prueba.csv")

print(
    "Label real:",
    int(registro.iloc[0]["label"])
)

print(
    "Categoría real:",
    registro.iloc[0]["attack_cat"]
)