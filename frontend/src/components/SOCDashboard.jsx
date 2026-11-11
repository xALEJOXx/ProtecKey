import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MLStats from "./MLStats";
import NetworkPulse from "./NetworkPulse";
import MLPredictionDetail from "./MLPredictionDetail";
import { useLiveMonitor } from "./LiveMonitorContext";

export default function SOCDashboard() {
  const { estado, flujos, totalRecibidos } = useLiveMonitor();
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/ml/history?limite=100&pagina=1", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.records)) throw new Error();
        if (active) {
          setRecords(
            data.records.filter(
              (r) => String(r.protocolo).toUpperCase() !== "TEST",
            ),
          );
          setError("");
          setUpdated(new Date());
        }
      } catch (e) {
        if (active && e.name !== "AbortError")
          setError(
            "Detecciones no disponibles. Comprueba la conexión con el API Gateway.",
          );
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [revision]);
  const normal =
    records?.filter((r) => r.prediccion != null && Number(r.prediccion) === 0)
      .length ?? 0;
  const threats =
    records?.filter((r) => Number(r.prediccion) === 1).length ?? 0;
  const classified = normal + threats;
  const protocols = Object.entries(
    flujos.reduce((acc, f) => {
      const key = f.protocolo?.toUpperCase() || "Sin protocolo";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  );
  return (
    <div className="soc-dashboard">
      <div className="soc-page-heading">
        <div>
          <span className="pk-eyebrow">VISIBILIDAD · DETECCIÓN · ANÁLISIS</span>
          <h1>
            Centro de operaciones<span className="soc-title-dot">.</span>
          </h1>
          <p>
            Una vista de tu red, las detecciones y lo que requiere atención.
          </p>
        </div>
        <div className="soc-heading-actions">
          <button onClick={() => setRevision((r) => r + 1)}>
            ↻ Actualizar
          </button>
          <Link className="soc-primary" to="/monitoreo">
            Abrir monitoreo →
          </Link>
        </div>
      </div>
      <MLStats key={revision} />
      <div className="soc-bento">
        <NetworkPulse />
        <section className="soc-panel soc-classifications">
          <div className="soc-panel-heading">
            <div>
              <span className="pk-eyebrow">CLASIFICACIÓN</span>
              <h2>Señales del modelo</h2>
            </div>
            <span className="soc-label">Últimas 100</span>
          </div>
          {error && (
            <p className="soc-error" role="alert">
              {error}
            </p>
          )}
          <div
            className="soc-donut"
            style={{
              "--normal": `${classified ? (normal / classified) * 100 : 0}%`,
              background: classified ? undefined : "#26323e",
            }}
          >
            <div>
              <strong>{records === null ? "—" : classified}</strong>
              <span>predicciones</span>
            </div>
          </div>
          <div className="soc-legend-row">
            <span>
              <i /> Normal
            </span>
            <strong>{records === null ? "—" : normal}</strong>
          </div>
          <div className="soc-legend-row danger">
            <span>
              <i /> Posible amenaza
            </span>
            <strong>{records === null ? "—" : threats}</strong>
          </div>
          <p className="soc-caption">
            Muestra reciente sin registros TEST. Una predicción requiere
            verificación.
          </p>
        </section>
      </div>
      <div className="soc-bento">
        <section className="soc-panel">
          <div className="soc-panel-heading">
            <div>
              <span className="pk-eyebrow">REGISTRO OPERATIVO</span>
              <h2>Actividad reciente</h2>
            </div>
            <Link to="/historial">Explorar historial →</Link>
          </div>
          {records === null ? (
            <div className="soc-empty">
              {error || "Consultando detecciones…"}
            </div>
          ) : records.length === 0 ? (
            <div className="soc-empty">
              Sin detecciones registradas. La actividad real aparecerá aquí.
            </div>
          ) : (
            <div className="soc-event-list">
              {records.slice(0, 6).map((r) => (
                <button
                  className="soc-event"
                  key={r.id}
                  onClick={() => setSelected(selected === r.id ? null : r.id)}
                  aria-expanded={selected === r.id}
                >
                  <span
                    className={`soc-event-marker ${Number(r.prediccion) === 1 ? "danger" : ""}`}
                  >
                    {Number(r.prediccion) === 1 ? "!" : "✓"}
                  </span>
                  <span>
                    <strong>
                      {Number(r.prediccion) === 1
                        ? "Actividad sospechosa"
                        : "Conexión clasificada como normal"}{" "}
                      <small>#{r.id}</small>
                    </strong>
                    <span className="soc-mono">
                      {r.ip_origen || "Origen no disponible"} →{" "}
                      {r.ip_destino || "Destino no disponible"}
                    </span>
                  </span>
                  <time>
                    {r.fecha_hora
                      ? new Date(r.fecha_hora).toLocaleString("es-CO")
                      : "Sin fecha"}
                  </time>
                  <span>→</span>
                </button>
              ))}
            </div>
          )}
          {selected !== null && (
            <MLPredictionDetail
              prediccionId={selected}
              onCerrar={() => setSelected(null)}
            />
          )}
          <div className="soc-panel-footer">
            {updated
              ? `Última consulta: ${updated.toLocaleTimeString("es-CO")}`
              : "Esperando respuesta del servicio"}{" "}
            · Actualización cada 10 s
          </div>
        </section>
        <section className="soc-panel">
          <div className="soc-panel-heading">
            <div>
              <span className="pk-eyebrow">SENSOR DE RED</span>
              <h2>Tráfico de la sesión</h2>
            </div>
            <span className="soc-label">{estado}</span>
          </div>
          <div className="soc-session-total">
            <strong>{totalRecibidos.toLocaleString("es-CO")}</strong>
            <span>flujos recibidos</span>
          </div>
          {protocols.length ? (
            protocols.map(([name, count]) => (
              <div className="soc-protocol" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
                <progress
                  value={count}
                  max={flujos.length}
                  aria-label={`Flujos ${name}`}
                />
              </div>
            ))
          ) : (
            <div className="soc-empty compact">
              Sin tráfico recibido en esta sesión.
            </div>
          )}
          <p className="soc-caption">
            Distribución de los últimos {flujos.length} flujos conservados,
            hasta 200.
          </p>
          <Link className="soc-text-link" to="/analizar">
            Analizar un archivo CSV →
          </Link>
        </section>
      </div>
    </div>
  );
}
