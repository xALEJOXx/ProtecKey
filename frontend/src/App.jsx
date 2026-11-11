import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import IndividualAnalysis from "./components/IndividualAnalysis";
import "./App.css";
import AnalysisForm from "./components/AnalysisForm";
import BatchHistory from "./components/BatchHistory";
import IndividualResult from "./components/IndividualResult";
import LiveMonitor from "./components/LiveMonitor";
import { LiveMonitorProvider } from "./components/LiveMonitorContext";
import NetworkHistory from "./components/NetworkHistory";
import MLHistory from "./components/MLHistory";
import SOCIcon from "./components/SOCIcon";
import SOCDashboard from "./components/SOCDashboard";
import LearningLab from "./components/LearningLab";
import HistoryWorkspace from "./components/HistoryWorkspace";
import "./soc.css";

const API_URL = "";

const opciones = [
  { ruta: "/", icono: "⌂", nombre: "Inicio" },
  { ruta: "/analizar", icono: "◎", nombre: "Nuevo análisis" },
  { ruta: "/monitoreo", icono: "◉", nombre: "Monitoreo en vivo" },
  { ruta: "/resultados", icono: "◉", nombre: "Resultados" },
  { ruta: "/historial", icono: "▤", nombre: "Historial" },
  { ruta: "/aprende", icono: "✦", nombre: "Aprende" },
];

function ProtecKey() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const [errorHistorial, setErrorHistorial] = useState("");

  const [estado, setEstado] = useState("Comprobando...");
  const [historial, setHistorial] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroHistorial, setFiltroHistorial] = useState("todos");
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizarLotes, setActualizarLotes] = useState(0);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [tipoAnalisis, setTipoAnalisis] = useState("lote");
  const [tipoUltimoResultado, setTipoUltimoResultado] = useState("lote");

  useEffect(() => {
    if (!registroSeleccionado) return;
    const cerrar = (e) => {
      if (e.key === "Escape") setRegistroSeleccionado(null);
    };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [registroSeleccionado]);

  const comprobarAPI = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/health`);
      if (!respuesta.ok) throw new Error("API no disponible");
      const datos = await respuesta.json();
      if (!datos || typeof datos !== "object")
        throw new Error("Respuesta no válida");
      setEstado("Activo");
    } catch {
      setEstado("Sin conexión");
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/history`);
      if (!respuesta.ok) throw new Error("Error consultando historial");

      const datos = await respuesta.json();

      if (datos.status === "success") {
        setHistorial(datos.records ?? []);
        setErrorHistorial("");
      } else {
        throw new Error("Respuesta de historial no válida");
      }
    } catch (error) {
      setErrorHistorial("No se pudo actualizar el historial individual.");
      console.error("Error cargando historial:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Cancel the initial task on unmount, including the StrictMode probe.
    const initialTask = setTimeout(() => {
      comprobarAPI();
      cargarHistorial();
    }, 0);
    return () => clearTimeout(initialTask);
  }, [comprobarAPI, cargarHistorial]);

  const actualizarHistoriales = () => {
    cargarHistorial();
    setActualizarLotes((valor) => valor + 1);
  };

  const recibirResultado = (resultado, archivo, tipo = "lote") => {
    setUltimoResultado(resultado);
    setNombreArchivo(archivo);
    setTipoUltimoResultado(tipo);
    navegar("/resultados");
  };

  const historialFiltrado = historial.filter((registro) => {
    const busqueda = busquedaHistorial.trim().replace(/^#/, "");

    const coincideBusqueda =
      busqueda === "" ||
      [
        registro.id,
        registro.classification,
        registro.evaluation,
        registro.fecha_hora,
      ].some((valor) =>
        String(valor ?? "")
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      );

    const prediccion = Number(registro.prediction);

    const coincideFiltro =
      filtroHistorial === "todos" ||
      (filtroHistorial === "normal" && prediccion === 0) ||
      (filtroHistorial === "malicioso" && prediccion === 1) ||
      (filtroHistorial === "evaluados" &&
        ["TP", "TN", "FP", "FN"].includes(registro.evaluation)) ||
      (filtroHistorial === "sin-evaluar" &&
        !["TP", "TN", "FP", "FN"].includes(registro.evaluation));

    return coincideBusqueda && coincideFiltro;
  });

  const historialIndividual = (
    <section className="panel">
      <div className="panel-titulo">
        <div>
          <h2>Análisis individuales</h2>
          <p>Predicciones individuales guardadas en PostgreSQL.</p>
        </div>

        <button
          onClick={() => {
            setCargando(true);
            cargarHistorial();
          }}
        >
          Actualizar
        </button>
      </div>

      <div className="pk-history-filters">
        <div className="pk-history-search">
          <span className="pk-history-search-icon">⌕</span>

          <input
            type="search"
            placeholder="Buscar ID, fecha, clasificación…"
            aria-label="Buscar análisis por ID, fecha o clasificación"
            value={busquedaHistorial}
            onChange={(e) => setBusquedaHistorial(e.target.value)}
          />
        </div>

        <div className="pk-history-filter-buttons">
          {[
            { valor: "todos", texto: "Todos" },
            { valor: "normal", texto: "Normales" },
            { valor: "malicioso", texto: "Posibles amenazas" },
            { valor: "evaluados", texto: "Evaluados" },
            { valor: "sin-evaluar", texto: "Sin evaluar" },
          ].map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={`pk-history-filter-btn ${
                filtroHistorial === opcion.valor ? "active" : ""
              }`}
              onClick={() => setFiltroHistorial(opcion.valor)}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>

      <div className="pk-history-filter-summary">
        Mostrando <strong>{historialFiltrado.length}</strong> de{" "}
        <strong>{historial.length}</strong> análisis individuales
      </div>

      {errorHistorial && <p role="alert">{errorHistorial}</p>}
      {cargando ? (
        <p>Cargando historial...</p>
      ) : errorHistorial && historial.length === 0 ? null : historial.length ===
        0 ? (
        <p>Todavía no hay análisis individuales guardados.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Predicción</th>
                <th>Clasificación</th>
                <th>Evaluación</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {historialFiltrado.length === 0 && (
                <tr>
                  <td colSpan="6">Ningún registro coincide con los filtros.</td>
                </tr>
              )}
              {historialFiltrado.map((registro) => (
                <tr key={registro.id}>
                  <td>#{registro.id}</td>
                  <td>{new Date(registro.fecha_hora).toLocaleString()}</td>
                  <td>{registro.prediction}</td>
                  <td>
                    <span
                      className={
                        registro.prediction === 1 ? "malicioso" : "normal"
                      }
                    >
                      {registro.classification}
                    </span>
                  </td>
                  <td>
                    {registro.evaluation === "TP"
                      ? "Verdadero positivo (TP)"
                      : registro.evaluation === "TN"
                        ? "Verdadero negativo (TN)"
                        : registro.evaluation === "FP"
                          ? "Falso positivo (FP)"
                          : registro.evaluation === "FN"
                            ? "Falso negativo (FN)"
                            : "Sin evaluar"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pk-history-detail-button"
                      onClick={() => setRegistroSeleccionado(registro)}
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {registroSeleccionado && (
        <div className="pk-history-detail-overlay">
          <div
            className="pk-history-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pk-history-detail-title"
          >
            <div className="pk-history-detail-header">
              <div>
                <span className="pk-eyebrow">DETALLES DEL ANÁLISIS</span>
                <h2 id="pk-history-detail-title">
                  Registro #{registroSeleccionado.id}
                </h2>
              </div>

              <button
                type="button"
                className="pk-history-detail-close"
                onClick={() => setRegistroSeleccionado(null)}
                aria-label="Cerrar detalles"
              >
                ×
              </button>
            </div>

            <div className="pk-history-detail-grid">
              <div>
                <span>Fecha del análisis</span>
                <strong>
                  {new Date(registroSeleccionado.fecha_hora).toLocaleString(
                    "es-CO",
                  )}
                </strong>
              </div>

              <div>
                <span>Predicción del modelo</span>
                <strong>
                  {registroSeleccionado.prediction === 1
                    ? "1 — Potencialmente malicioso"
                    : "0 — Normal"}
                </strong>
              </div>

              <div>
                <span>Etiqueta real</span>
                <strong>
                  {registroSeleccionado.real_label === 1
                    ? "1 — Malicioso"
                    : registroSeleccionado.real_label === 0
                      ? "0 — Normal"
                      : "No disponible"}
                </strong>
              </div>

              <div>
                <span>Evaluación</span>
                <strong>
                  {{
                    TP: "Verdadero positivo (TP)",
                    TN: "Verdadero negativo (TN)",
                    FP: "Falso positivo (FP)",
                    FN: "Falso negativo (FN)",
                  }[registroSeleccionado.evaluation] || "Sin evaluar"}
                </strong>
              </div>
            </div>

            <div className="pk-history-detail-explanation">
              <h3>Interpretación del resultado</h3>
              <p>
                {{
                  TP: "El modelo identificó correctamente un registro etiquetado como malicioso.",
                  TN: "El modelo identificó correctamente un registro etiquetado como normal.",
                  FP: "El modelo clasificó como potencialmente malicioso un registro cuya etiqueta real era normal.",
                  FN: "El modelo clasificó como normal un registro cuya etiqueta real era maliciosa.",
                }[registroSeleccionado.evaluation] ||
                  "Este análisis no tiene una etiqueta real disponible, por lo que no es posible comprobar si la predicción fue correcta."}
              </p>
            </div>

            <div className="pk-history-detail-footer">
              <button
                type="button"
                className="pk-primary-button"
                onClick={() => setRegistroSeleccionado(null)}
              >
                Cerrar detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <div className={`pk-layout ${menuAbierto ? "soc-menu-open" : ""}`}>
      <aside className="pk-sidebar">
        <div className="pk-brand">
          <div className="pk-brand-icon">
            <SOCIcon name="shield" />
          </div>
          <div>
            <strong>ProtecKey</strong>
            <small>SECURITY OPERATIONS</small>
          </div>
        </div>

        <div className="pk-menu-label">WORKSPACE</div>

        <nav className="pk-navigation">
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              onClick={() => setMenuAbierto(false)}
              end={opcion.ruta === "/"}
              className={({ isActive }) =>
                `pk-nav-link ${isActive ? "pk-nav-active" : ""}`
              }
            >
              <span className="pk-nav-icon">
                <SOCIcon name={opcion.ruta} />
              </span>
              <span>{opcion.nombre}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pk-sidebar-bottom">
          <div
            className={`pk-status-dot ${estado === "Activo" ? "soc-connected" : "soc-disconnected"}`}
          />
          <div>
            <strong>{estado}</strong>
            <small>Estado de la API</small>
          </div>
        </div>
      </aside>

      <div className="pk-main">
        <header className="pk-topbar">
          <div>
            <button
              className="soc-menu-toggle"
              aria-label="Abrir o cerrar navegación"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              ☰
            </button>
            <span className="pk-eyebrow">WORKSPACE / </span>
            <strong>
              {opciones.find((opcion) => opcion.ruta === pathname)?.nombre ||
                "ProtecKey"}
            </strong>
          </div>

          <span className="soc-top-status">
            <i
              className={
                estado === "Activo" ? "soc-connected" : "soc-disconnected"
              }
            />
            API · {estado}
          </span>
        </header>

        <main className="pk-page">
          <Routes>
            <Route
              path="/monitoreo"
              element={
                <>
                  <LiveMonitor />
                </>
              }
            />
            <Route path="/" element={<SOCDashboard />} />

            <Route
              path="/analizar"
              element={
                <div className="pk-page">
                  <div className="pk-analysis-heading">
                    <span className="pk-eyebrow">CENTRO DE ANÁLISIS</span>
                    <h1>Nuevo análisis</h1>
                    <p>
                      Selecciona cómo deseas analizar el tráfico de red.
                      ProtecKey te acompañará durante el proceso.
                    </p>
                  </div>

                  <div className="pk-analysis-selector">
                    <button
                      type="button"
                      className={
                        tipoAnalisis === "individual"
                          ? "pk-analysis-option selected"
                          : "pk-analysis-option"
                      }
                      onClick={() => setTipoAnalisis("individual")}
                    >
                      <span className="pk-analysis-option-icon">◎</span>
                      <strong>Análisis individual</strong>
                      <small>
                        Analiza una conexión mediante un formulario guiado o un
                        CSV de una sola fila.
                      </small>
                    </button>

                    <button
                      type="button"
                      className={
                        tipoAnalisis === "lote"
                          ? "pk-analysis-option selected"
                          : "pk-analysis-option"
                      }
                      onClick={() => setTipoAnalisis("lote")}
                    >
                      <span className="pk-analysis-option-icon">▤</span>
                      <strong>Análisis por lotes</strong>
                      <small>
                        Carga un archivo CSV para analizar múltiples conexiones
                        de red.
                      </small>
                    </button>
                  </div>

                  {tipoAnalisis === "individual" ? (
                    <IndividualAnalysis
                      onAnalysisComplete={actualizarHistoriales}
                      onResultReady={recibirResultado}
                    />
                  ) : (
                    <AnalysisForm
                      onAnalysisComplete={actualizarHistoriales}
                      onResultReady={(resultado, archivo) =>
                        recibirResultado(resultado, archivo, "lote")
                      }
                    />
                  )}
                </div>
              }
            />

            <Route
              path="/resultados"
              element={
                <div className="pk-section">
                  <div className="pk-section-heading">
                    <span className="pk-eyebrow">REPORTE DEL ANÁLISIS</span>
                    <h1>Resultados</h1>
                    <p>
                      Consulta los resultados de tu análisis de tráfico de red.
                    </p>
                  </div>

                  {ultimoResultado && tipoUltimoResultado === "individual" ? (
                    <IndividualResult
                      resultado={ultimoResultado}
                      onNewAnalysis={() => {
                        setTipoAnalisis("individual");
                        navegar("/analizar");
                      }}
                    />
                  ) : ultimoResultado ? (
                    <div className="pk-results-view">
                      <div className="pk-results-header">
                        <div>
                          <span className="pk-eyebrow">
                            ANÁLISIS COMPLETADO
                          </span>
                          <h2>{nombreArchivo}</h2>
                          <p>
                            Estos resultados corresponden al último archivo
                            analizado durante esta sesión.
                          </p>
                        </div>

                        <button
                          className="pk-primary-button"
                          onClick={() => navegar("/analizar")}
                        >
                          Nuevo análisis →
                        </button>
                      </div>

                      <div className="pk-results-stats">
                        <div className="pk-stat-box">
                          <span>Registros analizados</span>
                          <strong>{ultimoResultado.detection.total}</strong>
                        </div>

                        <div className="pk-stat-box pk-stat-normal">
                          <span>Tráfico normal</span>
                          <strong>{ultimoResultado.detection.normal}</strong>
                        </div>

                        <div className="pk-stat-box pk-stat-alert">
                          <span>Posibles amenazas</span>
                          <strong>
                            {ultimoResultado.detection.potentially_malicious}
                          </strong>
                        </div>
                      </div>

                      <div className="pk-results-chart">
                        <h3>Distribución de clasificaciones</h3>

                        <div className="pk-chart-bar">
                          <div
                            className="pk-chart-normal"
                            style={{
                              width: `${
                                ultimoResultado.detection.total > 0
                                  ? (ultimoResultado.detection.normal /
                                      ultimoResultado.detection.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />

                          <div
                            className="pk-chart-alert"
                            style={{
                              width: `${
                                ultimoResultado.detection.total > 0
                                  ? (ultimoResultado.detection
                                      .potentially_malicious /
                                      ultimoResultado.detection.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <div className="pk-chart-legend">
                          <span>
                            🟢 Normal:{" "}
                            {ultimoResultado.detection.total > 0
                              ? (
                                  (ultimoResultado.detection.normal /
                                    ultimoResultado.detection.total) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </span>

                          <span>
                            🔴 Potencialmente malicioso:{" "}
                            {Number(
                              ultimoResultado.detection.malicious_percentage,
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>

                      {Array.isArray(ultimoResultado.detection?.results) &&
                        ultimoResultado.detection.results.length > 0 && (
                          <section className="pk-results-chart">
                            <h3>Detalle de predicciones</h3>

                            <p>
                              Clasificación y puntuación estimada de tráfico
                              malicioso para cada registro analizado.
                            </p>

                            <div
                              style={{ overflowX: "auto", marginTop: "16px" }}
                            >
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  textAlign: "left",
                                }}
                              >
                                <thead>
                                  <tr>
                                    <th style={{ padding: "12px" }}>
                                      Registro
                                    </th>
                                    <th style={{ padding: "12px" }}>
                                      Clasificación
                                    </th>
                                    <th style={{ padding: "12px" }}>
                                      Puntuación
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {ultimoResultado.detection.results
                                    .slice(0, 20)
                                    .map((registro, indice) => {
                                      const puntuacion =
                                        registro.malicious_probability;

                                      const porcentaje =
                                        puntuacion !== null &&
                                        puntuacion !== undefined &&
                                        Number.isFinite(Number(puntuacion))
                                          ? `${(
                                              Number(puntuacion) * 100
                                            ).toLocaleString("es-CO", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })} %`
                                          : "No disponible";

                                      return (
                                        <tr key={registro.index ?? indice}>
                                          <td style={{ padding: "12px" }}>
                                            #{(registro.index ?? indice) + 1}
                                          </td>

                                          <td style={{ padding: "12px" }}>
                                            {registro.prediction === 1
                                              ? "Potencialmente malicioso"
                                              : registro.prediction === 0
                                                ? "Normal"
                                                : "No disponible"}
                                          </td>

                                          <td style={{ padding: "12px" }}>
                                            <strong>{porcentaje}</strong>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>

                            {ultimoResultado.detection.results.length > 20 && (
                              <p style={{ marginTop: "12px" }}>
                                Se muestran los primeros 20 registros de{" "}
                                {ultimoResultado.detection.results.length}{" "}
                                analizados.
                              </p>
                            )}

                            <small>
                              Las puntuaciones son estimaciones del modelo, no
                              confirmaciones de ataques.
                            </small>
                          </section>
                        )}

                      <div className="pk-results-explanation">
                        <h3>¿Qué significa este resultado?</h3>
                        <p>
                          ProtecKey identificó{" "}
                          <strong>
                            {ultimoResultado.detection.potentially_malicious}
                          </strong>{" "}
                          registros con patrones potencialmente maliciosos, de
                          un total de{" "}
                          <strong>{ultimoResultado.detection.total}</strong>.
                        </p>
                        <p>
                          Estas clasificaciones no confirman ataques reales. Los
                          registros señalados pueden requerir una revisión
                          adicional.
                        </p>
                      </div>

                      {ultimoResultado.evaluation && (
                        <div className="pk-results-evaluation">
                          <h3>Evaluación del modelo</h3>
                          <p>
                            El archivo contiene etiquetas reales, por lo que fue
                            posible calcular métricas de evaluación.
                          </p>

                          <div className="pk-results-stats">
                            {Object.entries(
                              ultimoResultado.evaluation.metrics,
                            ).map(([nombre, valor]) => (
                              <div className="pk-stat-box" key={nombre}>
                                <span>{nombre.toUpperCase()}</span>
                                <strong>
                                  {(Number(valor) * 100).toFixed(2)}%
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pk-empty-state">
                      <div className="pk-empty-icon">◎</div>
                      <h2>Todavía no hay resultados en esta sesión</h2>
                      <p>Realiza un análisis para visualizar sus resultados.</p>

                      <button
                        className="pk-primary-button"
                        onClick={() => navegar("/analizar")}
                      >
                        Comenzar análisis →
                      </button>
                    </div>
                  )}
                </div>
              }
            />

            <Route
              path="/historial"
              element={
                <div className="pk-section">
                  <div className="pk-section-heading">
                    <span className="pk-eyebrow">ACTIVIDAD GUARDADA</span>
                    <h1>Historial de análisis</h1>
                    <p>Consulta tus análisis por lotes e individuales.</p>
                  </div>

                  <HistoryWorkspace
                    individual={historialIndividual}
                    network={<NetworkHistory />}
                    ml={<MLHistory />}
                    batch={<BatchHistory key={actualizarLotes} />}
                  />
                </div>
              }
            />

            <Route path="/aprende" element={<LearningLab />} />

            <Route
              path="*"
              element={
                <div className="pk-empty-state">
                  <h2>Página no encontrada</h2>
                  <button
                    className="pk-primary-button"
                    onClick={() => navegar("/")}
                  >
                    Volver al inicio
                  </button>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LiveMonitorProvider>
        <ProtecKey />
      </LiveMonitorProvider>
    </BrowserRouter>
  );
}

export default App;
