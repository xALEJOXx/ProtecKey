import "./MLAlerts.css";
import { useEffect, useState } from "react";

const nombresMetricas = {
  dur: "Duración del flujo (segundos)",
  rate: "Tasa de paquetes",
  dload: "Carga de destino",
  dpkts: "Paquetes hacia destino",
  proto: "Protocolo",
  sload: "Carga de origen",
  spkts: "Paquetes desde origen",
  dbytes: "Bytes hacia destino",
  dinpkt: "Intervalo entre paquetes de destino",
  sbytes: "Bytes desde origen",
  sinpkt: "Intervalo entre paquetes de origen",
};

function formatearNumero(valor, decimales = 2) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return String(valor ?? "No disponible");
  return numero.toLocaleString("es-CO", {
    maximumFractionDigits: decimales,
  });
}

function formatearFecha(valor) {
  return valor ? new Date(valor).toLocaleString("es-CO") : "No disponible";
}

function EtiquetaGravedad({ analisis }) {
  const estilos = {
    informativa: { texto: "INFORMATIVA", color: "#4ade80" },
    advertencia: { texto: "ADVERTENCIA", color: "#facc15" },
    alta: { texto: "ALTA", color: "#f87171" },
    critica: { texto: "CRITICA", color: "#ef4444" },
  };

  const estado = estilos[analisis?.gravedad] || {
    texto: "SIN CLASIFICAR",
    color: "#94a3b8",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 8,
        border: `1px solid ${estado.color}`,
        color: estado.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {estado.texto}
    </span>
  );
}

function AnalisisProteccion({ analisis }) {
  if (!analisis || !Object.keys(analisis).length) {
    return (
      <p style={{ color: "#94a3b8" }}>
        Esta deteccion no tiene un analisis de gravedad registrado.
      </p>
    );
  }

  const recomendaciones = Array.isArray(analisis.recomendaciones)
    ? analisis.recomendaciones
    : [];

  const evidencias = Array.isArray(analisis.evidencias)
    ? analisis.evidencias
    : [];

  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 18,
        margin: "18px 0",
      }}
    >
      <h3>Analisis de seguridad de ProtecKey</h3>

      <div style={{ marginBottom: 14 }}>
        <EtiquetaGravedad analisis={analisis} />
      </div>

      <p>{analisis.descripcion || "Sin descripcion disponible."}</p>

      {evidencias.length > 0 && (
        <>
          <h4>Evidencias registradas</h4>
          <ul>
            {evidencias.map((evidencia, indice) => (
              <li key={indice}>{evidencia}</li>
            ))}
          </ul>
        </>
      )}

      {recomendaciones.length > 0 && (
        <>
          <h4>Recomendaciones</h4>
          <ul>
            {recomendaciones.map((recomendacion, indice) => (
              <li key={indice}>{recomendacion}</li>
            ))}
          </ul>
        </>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: 8,
        }}
      >
        <strong>Estado de proteccion</strong>

        <p style={{ margin: "8px 0 0" }}>
          Modo:{" "}
          {analisis.modo === "simulacion"
            ? "Simulacion"
            : analisis.modo || "No disponible"}
        </p>

        <p style={{ margin: "5px 0 0" }}>
          Bloqueo autorizado: {analisis.bloqueo_autorizado ? "Si" : "No"}
        </p>

        {analisis.modo === "simulacion" && (
          <p
            style={{
              marginTop: 10,
              color: "#facc15",
              fontSize: 13,
            }}
          >
            ProtecKey no ha ejecutado ningun bloqueo real. La respuesta
            automatica permanece en simulacion.
          </p>
        )}
      </div>
    </div>
  );
}

function DecisionProteccion({ analisis }) {
  const decision = analisis?.decision_proteccion;

  if (!decision) {
    return (
      <p style={{ color: "#94a3b8", marginTop: 12 }}>
        Esta deteccion no tiene una decision de proteccion registrada.
      </p>
    );
  }

  const nombres = {
    no_bloquear: "No bloquear",
    revision_requerida: "Revision requerida",
    solo_monitorear: "Continuar monitoreo",
  };

  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        border: "1px solid #334155",
        borderRadius: 12,
        background: "rgba(15, 23, 42, 0.35)",
      }}
    >
      <h4 style={{ marginTop: 0 }}>Decision de proteccion</h4>

      <p>
        <strong>Decision: </strong>
        {nombres[decision.decision] || decision.decision || "No disponible"}
      </p>

      <p>
        <strong>Motivo: </strong>
        {decision.motivo || "Sin motivo registrado"}
      </p>

      <p>
        <strong>Accion recomendada: </strong>
        {decision.accion || "Continuar monitoreo"}
      </p>

      <p>
        <strong>IP protegida: </strong>
        {decision.ip_protegida ? "Si" : "No"}
      </p>

      <p>
        <strong>Bloqueo ejecutado: </strong>
        {decision.bloqueo_ejecutado ? "Si" : "No"}
      </p>

      <p
        style={{
          marginBottom: 0,
          color: "#facc15",
          fontSize: 12,
        }}
      >
        Esta decision es informativa. ProtecKey permanece en modo simulacion.
      </p>
    </div>
  );
}

export default function MLAlerts() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ultimaRevision, setUltimaRevision] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  useEffect(() => {
    let activo = true;
    const controlador = new AbortController();

    async function consultarAlertas() {
      try {
        const respuesta = await fetch("/api/ml/history?limite=100&pagina=1", {
          signal: controlador.signal,
        });

        if (!respuesta.ok) {
          throw new Error(`HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        if (!activo) return;

        const sospechosas = (datos.records || []).filter(
          (registro) =>
            Number(registro.prediccion) === 1 &&
            String(registro.protocolo).toUpperCase() !== "TEST",
        );

        setAlertas(sospechosas);
        setUltimaRevision(new Date());
        setError("");
      } catch (err) {
        if (activo && err.name !== "AbortError") {
          setError("No se pudieron actualizar las alertas.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    consultarAlertas();
    const intervalo = setInterval(consultarAlertas, 10000);

    return () => {
      activo = false;
      clearInterval(intervalo);
      controlador.abort();
    };
  }, []);

  useEffect(() => {
    if (!detalle) return;

    function cerrarConEscape(evento) {
      if (evento.key === "Escape") setDetalle(null);
    }

    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [detalle]);

  async function verDetalles(id) {
    setDetalle({ id });
    setCargandoDetalle(true);
    setErrorDetalle("");

    try {
      const respuesta = await fetch(`/api/ml/predictions/${id}`);

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();
      setDetalle(datos);
    } catch (err) {
      setErrorDetalle(
        `No se pudo consultar la detección #${id}. ${err.message}`,
      );
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <section className="pk-ml-alerts">
      <div className="pk-ml-alerts-header">
        <div>
          <span className="pk-ml-alerts-eyebrow">VIGILANCIA INTELIGENTE</span>
          <h2>Alertas de seguridad</h2>
          <p>
            Conexiones clasificadas como sospechosas por el modelo experimental
            LightGBM.
          </p>
        </div>

        <div
          className={`pk-ml-alerts-counter ${error || cargando ? "soc-unavailable" : ""}`}
        >
          <strong>{cargando || error ? "—" : alertas.length}</strong>
          <span>Alertas recientes</span>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {cargando && <p role="status">Consultando alertas…</p>}
      {!cargando && !error && alertas.length === 0 && (
        <div className="pk-ml-alerts-empty">
          No se encontraron conexiones sospechosas entre las últimas 100
          predicciones.
        </div>
      )}

      <div className="pk-ml-alerts-list">
        {alertas.map((alerta) => (
          <article className="pk-ml-alert-item" key={alerta.id}>
            <div className="pk-ml-alert-top">
              <strong>Actividad sospechosa #{alerta.id}</strong>
              <EtiquetaGravedad analisis={alerta.analisis_amenaza} />
              <span>
                {formatearNumero(Number(alerta.probabilidad_ataque) * 100)} %
              </span>
            </div>

            <p>
              {alerta.ip_origen || "Desconocida"}
              {" → "}
              {alerta.ip_destino || "Desconocida"}
            </p>

            <div className="pk-ml-alert-meta">
              <span>{String(alerta.protocolo).toUpperCase()}</span>
              <span>{formatearFecha(alerta.fecha_hora)}</span>
            </div>

            <button
              type="button"
              className="pk-ml-detail-button"
              onClick={() => verDetalles(alerta.id)}
            >
              Ver detalles
            </button>
          </article>
        ))}
      </div>

      <p className="pk-ml-alerts-note">
        Las alertas son experimentales y requieren verificación. No confirman
        ataques.
        {ultimaRevision && (
          <> Última revisión: {ultimaRevision.toLocaleTimeString("es-CO")}.</>
        )}
      </p>

      {detalle && (
        <div
          className="pk-ml-modal-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setDetalle(null);
            }
          }}
        >
          <div
            className="pk-ml-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de detección ${detalle.id}`}
          >
            <div className="pk-ml-modal-header">
              <div>
                <span className="pk-ml-alerts-eyebrow">
                  ANÁLISIS DE CONEXIÓN
                </span>
                <h2>Detección #{detalle.id}</h2>
              </div>

              <button
                type="button"
                className="pk-ml-modal-close"
                onClick={() => setDetalle(null)}
                aria-label="Cerrar detalles"
              >
                ×
              </button>
            </div>

            {cargandoDetalle && (
              <p>Consultando información de la detección...</p>
            )}

            {errorDetalle && (
              <p role="alert" className="pk-ml-detail-error">
                {errorDetalle}
              </p>
            )}

            {!cargandoDetalle && !errorDetalle && detalle.caracteristicas && (
              <>
                <div className="pk-ml-detail-probability">
                  <span>Probabilidad estimada de ataque</span>
                  <strong>
                    {formatearNumero(Number(detalle.probabilidad_ataque) * 100)}{" "}
                    %
                  </strong>
                  <div className="pk-ml-probability-track">
                    <div
                      className="pk-ml-probability-fill"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            Number(detalle.probabilidad_ataque) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <AnalisisProteccion analisis={detalle.analisis_amenaza} />
                <DecisionProteccion analisis={detalle.analisis_amenaza} />

                <h3>Información de la conexión</h3>
                <div className="pk-ml-detail-grid">
                  <div>
                    <span>IP de origen</span>
                    <strong>{detalle.ip_origen || "No disponible"}</strong>
                  </div>
                  <div>
                    <span>Puerto de origen</span>
                    <strong>{detalle.puerto_origen ?? "No disponible"}</strong>
                  </div>
                  <div>
                    <span>IP de destino</span>
                    <strong>{detalle.ip_destino || "No disponible"}</strong>
                  </div>
                  <div>
                    <span>Puerto de destino</span>
                    <strong>{detalle.puerto_destino ?? "No disponible"}</strong>
                  </div>
                  <div>
                    <span>Protocolo</span>
                    <strong>{String(detalle.protocolo).toUpperCase()}</strong>
                  </div>
                  <div>
                    <span>Fecha y hora</span>
                    <strong>{formatearFecha(detalle.fecha_hora)}</strong>
                  </div>
                </div>

                <h3>Características analizadas por LightGBM</h3>
                <div className="pk-ml-metrics">
                  {Object.entries(detalle.caracteristicas).map(
                    ([clave, valor]) => (
                      <div className="pk-ml-metric" key={clave}>
                        <span>{nombresMetricas[clave] || clave}</span>
                        <strong>
                          {typeof valor === "number"
                            ? formatearNumero(valor, 4)
                            : String(valor ?? "No disponible")}
                        </strong>
                      </div>
                    ),
                  )}
                </div>

                {detalle.estado_tcp_info &&
                  Object.keys(detalle.estado_tcp_info).length > 0 && (
                    <>
                      <h3>Información del estado TCP</h3>
                      <div className="pk-ml-metrics">
                        {Object.entries(detalle.estado_tcp_info).map(
                          ([clave, valor]) => (
                            <div className="pk-ml-metric" key={clave}>
                              <span>{clave}</span>
                              <strong>
                                {typeof valor === "object"
                                  ? JSON.stringify(valor)
                                  : String(valor)}
                              </strong>
                            </div>
                          ),
                        )}
                      </div>
                    </>
                  )}

                <p className="pk-ml-detail-disclaimer">
                  Esta es una clasificaci?n experimental de LightGBM. Los
                  valores describen el flujo de red, pero no demuestran por s?
                  solos que exista un ataque ni identifican la aplicaci?n
                  responsable.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
