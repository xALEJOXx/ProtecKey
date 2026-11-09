from sklearn.metrics import (
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


def calcular_metricas(valores_reales, predicciones):

    # Matriz de confusión
    tn, fp, fn, tp = confusion_matrix(
        valores_reales,
        predicciones,
        labels=[0, 1]
    ).ravel()

    # Métricas principales
    accuracy = accuracy_score(
        valores_reales,
        predicciones
    )

    precision = precision_score(
        valores_reales,
        predicciones,
        zero_division=0
    )

    recall = recall_score(
        valores_reales,
        predicciones,
        zero_division=0
    )

    f1 = f1_score(
        valores_reales,
        predicciones,
        zero_division=0
    )

    # False Positive Rate
    if (fp + tn) > 0:
        fpr = fp / (fp + tn)
    else:
        fpr = 0.0

    # False Negative Rate
    if (fn + tp) > 0:
        fnr = fn / (fn + tp)
    else:
        fnr = 0.0

    return {
        "confusion_matrix": {
            "TN": int(tn),
            "FP": int(fp),
            "FN": int(fn),
            "TP": int(tp)
        },

        "metrics": {
            "accuracy": round(float(accuracy), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1": round(float(f1), 4),
            "fpr": round(float(fpr), 4),
            "fnr": round(float(fnr), 4)
        }
    }