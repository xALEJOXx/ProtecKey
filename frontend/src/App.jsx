
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import IndividualAnalysis from "./components/IndividualAnalysis";
import "./App.css";
import AnalysisForm from "./components/AnalysisForm";
import BatchHistory from "./components/BatchHistory";
import IndividualResult from "./components/IndividualResult";

const API_URL = "http://127.0.0.1:8000";

const opciones = [
  { ruta: "/", icono: "⌂", nombre: "Inicio" },
  { ruta: "/analizar", icono: "◎", nombre: "Nuevo análisis" },
  { ruta: "/resultados", icono: "◉", nombre: "Resultados" },
  { ruta: "/historial", icono: "▤", nombre: "Historial" },
  { ruta: "/aprende", icono: "✦", nombre: "Aprende" },
];

function ProtecKey() {
  const navegar = useNavigate();
  
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
    comprobarAPI();
    cargarHistorial();
  }, []);

  const comprobarAPI = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/health`);
      if (!respuesta.ok) throw new Error("API no disponible");
      setEstado("Activo");
    } catch {
      setEstado("Sin conexión");
    }
  };

  const cargarHistorial = async () => {
    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/api/history`);
      if (!respuesta.ok) throw new Error("Error consultando historial");

      const datos = await respuesta.json();

      if (datos.status === "success") {
        setHistorial(datos.records ?? []);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setCargando(false);
    }
  };

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

  const totalIndividuales = historial.length;

  const totalNormales = historial.filter(
    (registro) => Number(registro.prediction) === 0
  ).length;

  const totalAmenazas = historial.filter(
    (registro) => Number(registro.prediction) === 1
  ).length;

  const totalEvaluados = historial.filter(
    (registro) =>
      ["TP", "TN", "FP", "FN"].includes(registro.evaluation)
  ).length;

  const porcentajeNormal = totalIndividuales > 0
    ? (totalNormales / totalIndividuales) * 100
    : 0;

  const porcentajeAmenazas = totalIndividuales > 0
    ? (totalAmenazas / totalIndividuales) * 100
    : 0;


  const historialFiltrado = historial.filter((registro) => {
    const busqueda = busquedaHistorial.trim().replace(/^#/, "");

    const coincideBusqueda =
      busqueda === "" ||
      String(registro.id).includes(busqueda);

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

        <button onClick={cargarHistorial}>Actualizar</button>
      </div>

      <div className="pk-history-filters">
        <div className="pk-history-search">
          <span className="pk-history-search-icon">⌕</span>

          <input
            type="search"
            placeholder="Buscar análisis por ID..."
            aria-label="Buscar análisis por ID"
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
            { valor: "sin-evaluar", texto: "Sin evaluar" }
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


      {cargando ? (
        <p>Cargando historial...</p>
      ) : historial.length === 0 ? (
        <p>Todavía no hay análisis individuales guardados.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
         {historialFiltrado.length === 0 && (
            <div className="pk-history-no-results">
              <strong>No se encontraron análisis</strong>
              <p>
                Prueba con otro ID o selecciona un filtro diferente.
              </p>
            </div>
          )}
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
              {historialFiltrado.map((registro) => (
                <tr key={registro.id}>
                  <td>#{registro.id}</td>
                  <td>
                    {new Date(registro.fecha_hora).toLocaleString()}
                  </td>
                  <td>{registro.prediction}</td>
                  <td>
                    <span
                      className={
                        registro.prediction === 1
                          ? "malicioso"
                          : "normal"
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
                  <td>
                    <button
                      type="button"
                      className="pk-history-detail-button"
                      onClick={() => setRegistroSeleccionado(registro)}
                    >
                      Ver detalles
                    </button>
                  </td>
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
                <span className="pk-eyebrow">
                  DETALLES DEL ANÁLISIS
                </span>
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
                  {new Date(
                    registroSeleccionado.fecha_hora
                  ).toLocaleString("es-CO")}
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
                    FN: "Falso negativo (FN)"
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
                  FN: "El modelo clasificó como normal un registro cuya etiqueta real era maliciosa."
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
    <div className="pk-layout">
      <aside className="pk-sidebar">
        <div className="pk-brand">
          <div className="pk-brand-icon">◆</div>
          <div>
            <strong>ProtecKey</strong>
            <small>Seguridad inteligente</small>
          </div>
        </div>

        <div className="pk-menu-label">EXPLORAR</div>

        <nav className="pk-navigation">
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              end={opcion.ruta === "/"}
              className={({ isActive }) =>
                `pk-nav-link ${isActive ? "pk-nav-active" : ""}`
              }
            >
              <span className="pk-nav-icon">{opcion.icono}</span>
              <span>{opcion.nombre}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pk-sidebar-bottom">
          <div className="pk-status-dot" />
          <div>
            <strong>{estado}</strong>
            <small>Estado de la API</small>
          </div>
        </div>
      </aside>

      <div className="pk-main">
        <header className="pk-topbar">
          <div>
            <span className="pk-eyebrow">CENTRO DE SEGURIDAD</span>
            <strong>Tu espacio de análisis</strong>
          </div>

          <span className="pk-topbar-brand">ProtecKey</span>
        </header>

        <main className="pk-page">
          <Routes>
            <Route
              path="/"
              element={
                <div className="pk-home">
                  <section className="pk-hero">
                    <div className="pk-hero-copy">
                      <span className="pk-hero-tag">
                        PROTECCIÓN INTELIGENTE
                      </span>

                      <h1>
                        Entiende tu red.
                        <br />
                        <span>Descubre posibles amenazas.</span>
                      </h1>

                      <p>
                        ProtecKey te ayuda a analizar datos de tráfico
                        de red y comprender los resultados de manera
                        clara, incluso si no tienes experiencia
                        en ciberseguridad.
                      </p>

                      <button
                        className="pk-primary-button"
                        onClick={() => navegar("/analizar")}
                      >
                        Comenzar un análisis →
                      </button>
                    </div>

                    <div className="pk-hero-art" aria-hidden="true">
                      <div className="pk-orbit pk-orbit-one" />
                      <div className="pk-orbit pk-orbit-two" />
                      <div className="pk-shield">◆</div>
                    </div>
                  </section>

                  <section className="pk-home-grid">
                    <div className="pk-feature-card">
                      <div className="pk-feature-icon">◎</div>
                      <h3>Analiza fácilmente</h3>
                      <p>
                        Carga un archivo CSV y deja que ProtecKey
                        procese sus registros.
                      </p>
                      <button onClick={() => navegar("/analizar")}>
                        Ir a analizar →
                      </button>
                    </div>

                    <div className="pk-feature-card">
                      <div className="pk-feature-icon">◉</div>
                      <h3>Comprende los resultados</h3>
                      <p>
                        Consulta las clasificaciones y aprende a
                        interpretar los resultados del modelo.
                      </p>
                      <button onClick={() => navegar("/resultados")}>
                        Ver resultados →
                      </button>
                    </div>

                    <div className="pk-feature-card">
                      <div className="pk-feature-icon">▤</div>
                      <h3>Consulta tu actividad</h3>
                      <p>
                        Revisa tus análisis anteriores y sus
                        resultados almacenados.
                      </p>
                      <button onClick={() => navegar("/historial")}>
                        Abrir historial →
                      </button>
                    </div>
                  </section>

                  <section className="pk-dashboard">
                    <div className="pk-dashboard-heading">
                      <div>
                        <span className="pk-eyebrow">
                          RESUMEN DE ACTIVIDAD
                        </span>
                        <h2>Estado de tus análisis</h2>
                        <p>
                          Consulta la actividad individual registrada
                          en ProtecKey.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navegar("/historial")}
                      >
                        Ver historial →
                      </button>
                    </div>

                    <div className="pk-dashboard-stats">
                      <article className="pk-dashboard-stat">
                        <span className="pk-dashboard-stat-icon">▤</span>
                        <span>Análisis individuales</span>
                        <strong>{totalIndividuales}</strong>
                        <small>Registros almacenados</small>
                      </article>

                      <article className="pk-dashboard-stat">
                        <span className="pk-dashboard-stat-icon normal">✓</span>
                        <span>Tráfico normal</span>
                        <strong>{totalNormales}</strong>
                        <small>Clasificados como normales</small>
                      </article>

                      <article className="pk-dashboard-stat">
                        <span className="pk-dashboard-stat-icon danger">!</span>
                        <span>Posibles amenazas</span>
                        <strong>{totalAmenazas}</strong>
                        <small>Requieren interpretación</small>
                      </article>

                      <article className="pk-dashboard-stat">
                        <span className="pk-dashboard-stat-icon evaluated">◎</span>
                        <span>Análisis evaluados</span>
                        <strong>{totalEvaluados}</strong>
                        <small>Con etiqueta real conocida</small>
                      </article>
                    </div>

                    <div className="pk-dashboard-distribution">
                      <div className="pk-dashboard-distribution-heading">
                        <div>
                          <h3>Distribución del tráfico</h3>
                          <p>
                            Proporción de clasificaciones individuales.
                          </p>
                        </div>
                        <span>{totalIndividuales} registros</span>
                      </div>

                      <div className="pk-dashboard-bar">
                        <div
                          className="pk-dashboard-bar-normal"
                          style={{ width: `${porcentajeNormal}%` }}
                        />
                        <div
                          className="pk-dashboard-bar-danger"
                          style={{ width: `${porcentajeAmenazas}%` }}
                        />
                      </div>

                      <div className="pk-dashboard-legend">
                        <span>
                          <i className="pk-dashboard-dot normal" />
                          Normal: {porcentajeNormal.toFixed(1)}%
                        </span>

                        <span>
                          <i className="pk-dashboard-dot danger" />
                          Potencialmente malicioso: {porcentajeAmenazas.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </section>


                  <section className="pk-welcome-strip">
                    <div>
                      <span className="pk-eyebrow">TU ACTIVIDAD</span>
                      <h2>{historial.length} análisis individuales</h2>
                      <p>
                        Registros individuales almacenados actualmente
                        en PostgreSQL.
                      </p>
                    </div>

                    <button onClick={() => navegar("/historial")}>
                      Consultar actividad →
                    </button>
                  </section>
                </div>
              }
            />


            <Route
              path="/analizar"
              element={
                <div className="pk-page">
                  <div className="pk-analysis-heading">
                    <span className="pk-eyebrow">
                      CENTRO DE ANÁLISIS
                    </span>
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
                        Analiza una conexión mediante un formulario
                        guiado o un CSV de una sola fila.
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
                        Carga un archivo CSV para analizar
                        múltiples conexiones de red.
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
                    <span className="pk-eyebrow">
                      REPORTE DEL ANÁLISIS
                    </span>
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
                          <strong>
                            {ultimoResultado.detection.total}
                          </strong>
                        </div>

                        <div className="pk-stat-box pk-stat-normal">
                          <span>Tráfico normal</span>
                          <strong>
                            {ultimoResultado.detection.normal}
                          </strong>
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
                                      ultimoResultado.detection.total) * 100
                                  : 0
                              }%`,
                            }}
                          />

                          <div
                            className="pk-chart-alert"
                            style={{
                              width: `${
                                ultimoResultado.detection.total > 0
                                  ? (ultimoResultado.detection.potentially_malicious /
                                      ultimoResultado.detection.total) * 100
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
                              ultimoResultado.detection.malicious_percentage
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>

                      <div className="pk-results-explanation">
                        <h3>¿Qué significa este resultado?</h3>
                        <p>
                          ProtecKey identificó{" "}
                          <strong>
                            {ultimoResultado.detection.potentially_malicious}
                          </strong>{" "}
                          registros con patrones potencialmente maliciosos,
                          de un total de{" "}
                          <strong>
                            {ultimoResultado.detection.total}
                          </strong>.
                        </p>
                        <p>
                          Estas clasificaciones no confirman ataques reales.
                          Los registros señalados pueden requerir una
                          revisión adicional.
                        </p>
                      </div>

                      {ultimoResultado.evaluation && (
                        <div className="pk-results-evaluation">
                          <h3>Evaluación del modelo</h3>
                          <p>
                            El archivo contiene etiquetas reales, por lo
                            que fue posible calcular métricas de evaluación.
                          </p>

                          <div className="pk-results-stats">
                            {Object.entries(
                              ultimoResultado.evaluation.metrics
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
                      <p>
                        Realiza un análisis para visualizar sus resultados.
                      </p>

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
                    <p>
                      Consulta tus análisis por lotes e individuales.
                    </p>
                  </div>

                  <BatchHistory actualizar={actualizarLotes} />

                  {historialIndividual}
                </div>
              }
            />

            <Route
              path="/aprende"
              element={
                <div className="pk-section">
                  <div className="pk-section-heading">
                    <span className="pk-eyebrow">CONOCE PROTECKEY</span>
                    <h1>Aprende</h1>
                    <p>
                      Descubre cómo funciona el sistema y qué significan
                      sus resultados.
                    </p>
                  </div>

                  <div className="pk-learning-grid">
                    <article className="pk-feature-card">
                      <div className="pk-feature-icon">⌁</div>
                      <h3>¿Qué analiza ProtecKey?</h3>
                      <p>
                        Registros de tráfico de red para identificar
                        patrones potencialmente maliciosos.
                      </p>
                    </article>

                    <article className="pk-feature-card">
                      <div className="pk-feature-icon">◎</div>
                      <h3>¿Qué es LightGBM?</h3>
                      <p>
                        Es el modelo de aprendizaje automático que
                        utilizamos para clasificar los registros.
                      </p>
                    </article>

                    <article className="pk-feature-card">
                      <div className="pk-feature-icon">!</div>
                      <h3>¿Una alerta confirma un ataque?</h3>
                      <p>
                        No. Una alerta indica una clasificación
                        potencialmente maliciosa que debe interpretarse
                        con precaución.
                      </p>
                    </article>
                  </div>
                </div>
              }
            />

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
      <ProtecKey />
    </BrowserRouter>
  );
}

export default App;
