import { useEffect, useState } from "react";

function BatchHistory() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  async function cargarHistorial() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(
        "/api/batch-history"
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible consultar el historial");
      }

      const datos = await respuesta.json();
      setHistorial(datos.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  function porcentaje(valor) {
    return valor === null || valor === undefined
      ? "No disponible"
      : `${(Number(valor) * 100).toFixed(2)}%`;
  }

  function fecha(valor) {
    return new Date(valor).toLocaleString("es-CO");
  }

  return (
    <section className="batch-history">
      <div className="batch-history-header">
        <div>
          <h2>Historial de análisis por lotes</h2>
          <p>
            Consulta los archivos CSV analizados y sus resultados.
          </p>
        </div>

        <button onClick={cargarHistorial}>
          Actualizar historial
        </button>
      </div>

      {cargando && <p>Cargando historial...</p>}

      {error && <p className="batch-error">{error}</p>}

      {!cargando && !error && historial.length === 0 && (
        <p>No hay análisis por lotes registrados.</p>
      )}

      {!cargando && !error && historial.map((lote) => (
        <div className="batch-card" key={lote.id}>
          <div className="batch-card-header">
            <div>
              <h3>{lote.nombre_archivo}</h3>
              <span>
                Análisis #{lote.id} · {fecha(lote.fecha_hora)}
              </span>
            </div>

            <button
              onClick={() =>
                setSeleccionado(
                  seleccionado === lote.id ? null : lote.id
                )
              }
            >
              {seleccionado === lote.id
                ? "Ocultar detalles"
                : "Ver detalles"}
            </button>
          </div>

          <div className="batch-stats">
            <div>
              <strong>{lote.total_registros}</strong>
              <span>Registros</span>
            </div>

            <div>
              <strong>{lote.normales}</strong>
              <span>Normales</span>
            </div>

            <div>
              <strong>{lote.maliciosos}</strong>
              <span>Potencialmente maliciosos</span>
            </div>

            <div>
              <strong>{lote.porcentaje_malicioso}%</strong>
              <span>Porcentaje sospechoso</span>
            </div>
          </div>

          {seleccionado === lote.id && (
            <div className="batch-details">
              {lote.tiene_etiquetas ? (
                <>
                  <h4>Matriz de confusión</h4>

                  <div className="batch-metrics">
                    <span>TN: {lote.tn}</span>
                    <span>FP: {lote.fp}</span>
                    <span>FN: {lote.fn}</span>
                    <span>TP: {lote.tp}</span>
                  </div>

                  <h4>Métricas de evaluación</h4>

                  <div className="batch-metrics">
                    <span>Accuracy: {porcentaje(lote.accuracy)}</span>
                    <span>Precision: {porcentaje(lote.precision_score)}</span>
                    <span>Recall: {porcentaje(lote.recall)}</span>
                    <span>F1: {porcentaje(lote.f1)}</span>
                    <span>FPR: {porcentaje(lote.fpr)}</span>
                    <span>FNR: {porcentaje(lote.fnr)}</span>
                  </div>
                </>
              ) : (
                <p>
                  Este archivo no tenía etiquetas reales.
                  Por eso no se calcularon métricas de evaluación.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export default BatchHistory;
