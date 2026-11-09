
export default function IndividualResult({ resultado, onNewAnalysis }) {
  const deteccion = resultado?.detection;
  const guardado = resultado?.database;

  const evaluacion = resultado?.evaluation;
const codigoEvaluacion = evaluacion?.result;

const nombresEvaluacion = {
  TP: "Verdadero positivo",
  TN: "Verdadero negativo",
  FP: "Falso positivo",
  FN: "Falso negativo"
};

const explicacionesEvaluacion = {
  TP: "El modelo identificó correctamente un registro malicioso.",
  TN: "El modelo identificó correctamente un registro normal.",
  FP: "El modelo clasificó como potencialmente malicioso un registro que realmente era normal.",
  FN: "El modelo clasificó como normal un registro que realmente era malicioso."
};

const evaluacionDisponible =
  evaluacion?.evaluated === true &&
  Object.prototype.hasOwnProperty.call(
    nombresEvaluacion,
    codigoEvaluacion
  );

const evaluacionCorrecta =
  codigoEvaluacion === "TP" || codigoEvaluacion === "TN";

  const prediccion = Number(deteccion?.prediction);
  const esMalicioso = prediccion === 1;
  const esNormal = prediccion === 0;
  const esValido = esMalicioso || esNormal;

  const fecha = guardado?.fecha_hora
    ? new Date(guardado.fecha_hora)
    : null;

  return (
    <div className="pk-ind-result">
      <section
        className={`pk-ind-result-hero ${
          esMalicioso ? "pk-ind-danger" : "pk-ind-safe"
        }`}
      >
        <div className="pk-ind-result-symbol" aria-hidden="true">
          {esMalicioso ? "!" : "✓"}
        </div>

        <div className="pk-ind-result-summary">
          <span className="pk-eyebrow">
            ANÁLISIS INDIVIDUAL COMPLETADO
          </span>

          <h2>
            {esMalicioso
              ? "Actividad potencialmente maliciosa"
              : esNormal
                ? "Tráfico clasificado como normal"
                : "Clasificación no disponible"}
          </h2>

          <p>
            {esMalicioso
              ? "El modelo identificó características asociadas con tráfico potencialmente malicioso."
              : esNormal
                ? "El modelo clasificó este registro dentro de la categoría de tráfico normal."
                : "No se pudo interpretar la clasificación recibida."}
          </p>

          <span className="pk-ind-result-pill">
            {esValido
              ? `Predicción del modelo: ${prediccion}`
              : "Predicción desconocida"}
          </span>
        </div>
      </section>

      <div className="pk-ind-result-grid">
        <article className="pk-ind-result-card">
          <span className="pk-ind-result-card-icon">◎</span>
          <span>Registros analizados</span>
          <strong>1</strong>
          <small>Una conexión de red</small>
        </article>

        <article className="pk-ind-result-card">
          <span className="pk-ind-result-card-icon">▤</span>
          <span>Identificador del análisis</span>
          <strong>
            {guardado?.analysis_id != null
              ? `#${guardado.analysis_id}`
              : "—"}
          </strong>
          <small>
            {guardado?.saved
              ? "Guardado en PostgreSQL"
              : "Guardado no confirmado"}
          </small>
        </article>

        <article className="pk-ind-result-card">
          <span className="pk-ind-result-card-icon">◷</span>
          <span>Fecha del análisis</span>
          <strong className="pk-ind-result-date">
            {fecha && !Number.isNaN(fecha.getTime())
              ? fecha.toLocaleDateString("es-CO")
              : "No disponible"}
          </strong>
          <small>
            {fecha && !Number.isNaN(fecha.getTime())
              ? fecha.toLocaleTimeString("es-CO")
              : "Sin hora registrada"}
          </small>
        </article>
      </div>

      
    {evaluacionDisponible && (
    <section className="pk-ind-evaluation">
        <div className="pk-ind-evaluation-header">
        <div>
            <span className="pk-eyebrow">
            EVALUACIÓN DE LA PREDICCIÓN
            </span>
            <h3>
            {nombresEvaluacion[codigoEvaluacion]}
            </h3>
        </div>

        <span
            className={`pk-ind-evaluation-status ${
            evaluacionCorrecta
                ? "pk-ind-evaluation-correct"
                : "pk-ind-evaluation-incorrect"
            }`}
        >
            {evaluacionCorrecta
            ? "Predicción correcta"
            : "Predicción incorrecta"}
        </span>
        </div>

        <div className="pk-ind-evaluation-values">
        <div>
            <span>Etiqueta real</span>
            <strong>
            {evaluacion.real_label === 1
                ? "1 — Malicioso"
                : "0 — Normal"}
            </strong>
        </div>

        <div>
            <span>Predicción del modelo</span>
            <strong>
            {prediccion === 1
                ? "1 — Potencialmente malicioso"
                : "0 — Normal"}
            </strong>
        </div>
        </div>

        <p>{explicacionesEvaluacion[codigoEvaluacion]}</p>
    </section>
    )}


      <section className="pk-ind-result-explanation">
        <div className="pk-ind-result-info-icon">i</div>

        <div>
          <h3>¿Qué significa este resultado?</h3>

          <p>
            ProtecKey utilizó el modelo LightGBM para
            clasificar los datos de una conexión de red.
          </p>

          <p>
            {esMalicioso
              ? "La clasificación sugiere que el registro merece una revisión adicional. No significa que se haya confirmado un ataque."
              : "Una clasificación normal no garantiza que la conexión esté libre de amenazas. Es el resultado estimado por el modelo para este registro."}
          </p>

          <p>
            El análisis individual no genera métricas como
            precisión, recall o F1. Esas métricas requieren
            comparar predicciones con etiquetas reales.
          </p>
        </div>
      </section>

      <div className="pk-ind-result-actions">
        <button
          type="button"
          className="pk-primary-button"
          onClick={onNewAnalysis}
        >
          Realizar otro análisis →
        </button>
      </div>
    </div>
  );
}
