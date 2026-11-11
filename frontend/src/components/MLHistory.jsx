import React, { useEffect, useState } from "react";
import MLPredictionDetail from "./MLPredictionDetail";

const LIMITE = 20;


function mostrarGravedad(analisis) {
  const gravedad = analisis?.gravedad;

  const estilos = {
    informativa: { texto: "INFORMATIVA", color: "#4ade80" },
    advertencia: { texto: "ADVERTENCIA", color: "#facc15" },
    alta: { texto: "ALTA", color: "#f87171" },
    critica: { texto: "CRITICA", color: "#ef4444" }
  };

  const estado = estilos[gravedad] || {
    texto: "SIN CLASIFICAR",
    color: "#94a3b8"
  };

  return (
    <span style={{
      color: estado.color,
      border: `1px solid ${estado.color}`,
      borderRadius: 8,
      padding: "5px 9px",
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }}>
      {estado.texto}
    </span>
  );
}

function mostrarInicioTCP(registro) {
  if (String(registro.protocolo).toUpperCase() !== "TCP") {
    return <span style={{ color: "#94a3b8" }}>No aplica</span>;
  }

  const informacion = registro.analisis_amenaza?.inicio_conexion;

  if (!informacion) {
    return <span style={{ color: "#94a3b8" }}>Sin datos</span>;
  }

  const opciones = {
    local: { texto: "Local", color: "#38bdf8" },
    remoto: { texto: "Remoto", color: "#facc15" },
    desconocido: { texto: "Desconocido", color: "#94a3b8" }
  };

  const estado = opciones[informacion.inicio] || opciones.desconocido;

  const detalle = [
    informacion.motivo,
    informacion.estado_tcp
      ? `Estado TCP: ${informacion.estado_tcp}`
      : null
  ].filter(Boolean).join(" | ");

  return (
    <div title={detalle || "Sin informacion adicional"}>
      <span style={{
        color: estado.color,
        fontWeight: 600,
        whiteSpace: "nowrap"
      }}>
        {estado.texto}
      </span>
      {informacion.estado_tcp && (
        <div style={{
          color: "#94a3b8",
          fontSize: 11,
          marginTop: 4,
          whiteSpace: "nowrap"
        }}>
          {informacion.estado_tcp}
        </div>
      )}
    </div>
  );
}

export default function MLHistory() {
  const [registros, setRegistros] = useState([]);
  const [prediccionSeleccionada, setPrediccionSeleccionada] = useState(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const controlador = new AbortController();

    async function cargar() {
      try {
        const respuesta = await fetch(
          `/api/ml/history?limite=${LIMITE}&pagina=${pagina}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (activo) {
          setRegistros(datos.records || []);
          setTotal(datos.total || 0);
          setError("");
        }
      } catch (err) {
        if (activo && err.name !== "AbortError") {
          setError("No fue posible consultar las detecciones.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    const intervalo = setInterval(cargar, 10000);

    return () => {
      activo = false;
      clearInterval(intervalo);
      controlador.abort();
    };
  }, [pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  const fecha = (valor) =>
    valor ? new Date(valor).toLocaleString("es-CO") : "?";

  const porcentaje = (valor) =>
    `${(Number(valor || 0) * 100).toFixed(1)} %`;

  return (
    <section style={{ padding: "24px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{
          color: "#38bdf8",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2
        }}>
          INTELIGENCIA ARTIFICIAL
        </span>

        <h2>Historial de detecciones autom?ticas</h2>

        <p>
          Resultados experimentales de LightGBM obtenidos
          durante el monitoreo de red.
        </p>
      </div>

      <div style={{
        display: "flex",
        gap: 16,
        marginBottom: 20,
        flexWrap: "wrap"
      }}>
        <div style={{
          padding: 18,
          border: "1px solid #334155",
          borderRadius: 12,
          minWidth: 190
        }}>
          <small>Evaluaciones registradas</small>
          <h2>{total}</h2>
        </div>

        <div style={{
          padding: 18,
          border: "1px solid #334155",
          borderRadius: 12,
          minWidth: 190
        }}>
          <small>Modelo de detecci?n</small>
          <h2>LightGBM</h2>
        </div>
      </div>

      {cargando && <p>Cargando detecciones...</p>}

      {error && <p role="alert">{error}</p>}

      {!cargando && !error && registros.length === 0 && (
        <p>Todav?a no hay predicciones registradas.</p>
      )}

      {!error && registros.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr>
                  {[
                    "Fecha",
                    "Origen",
                    "Destino",
                    "Protocolo",
                    "Resultado",
                    "Gravedad",
                    "Probabilidad",
                    "Inicio TCP",
                    "Detalle"
                  ].map((titulo) => (
                    <th key={titulo} style={{
                      padding: 12,
                      borderBottom: "1px solid #475569"
                    }}>
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {registros.map((r) => {
                  const prueba = r.protocolo === "TEST";
                  const sospechoso = r.prediccion === 1;

                  return (
                    <React.Fragment key={r.id}>
                    <tr>
                      <td style={{ padding: 12 }}>
                        {fecha(r.fecha_hora)}
                      </td>

                      <td style={{ padding: 12 }}>
                        {r.ip_origen}:{r.puerto_origen}
                      </td>

                      <td style={{ padding: 12 }}>
                        {r.ip_destino}:{r.puerto_destino}
                      </td>

                      <td style={{ padding: 12 }}>
                        {r.protocolo}
                      </td>

                      <td style={{ padding: 12 }}>
                        <strong style={{
                          color: prueba
                            ? "#94a3b8"
                            : sospechoso
                              ? "#f87171"
                              : "#4ade80"
                        }}>
                          {prueba
                            ? "Prueba t?cnica"
                            : sospechoso
                              ? "Sospechoso"
                              : "Normal"}
                        </strong>
                      </td>

                      <td style={{ padding: 12 }}>
                        {mostrarGravedad(r.analisis_amenaza)}
                      </td>

                      <td style={{ padding: 12 }}>
                        {porcentaje(r.probabilidad_ataque)}
                      </td>

                      <td style={{ padding: 12 }}>
                        {mostrarInicioTCP(r)}
                      </td>

                      <td style={{ padding: 12 }}>
                        <button
                          type="button"
                          onClick={() =>
                            setPrediccionSeleccionada(
                              prediccionSeleccionada === r.id ? null : r.id
                            )
                          }
                          style={{
                            background: prediccionSeleccionada === r.id
                              ? "#0369a1"
                              : "#1e293b",
                            color: "#e0f2fe",
                            border: "1px solid #38bdf8",
                            borderRadius: 8,
                            padding: "8px 12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {prediccionSeleccionada === r.id
                            ? "Cerrar detalle"
                            : "Ver detalle"}
                        </button>
                      </td>
                    </tr>
                    {prediccionSeleccionada === r.id && (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            padding: "8px 12px 20px",
                            background: "#0b1220"
                          }}
                        >
                          <MLPredictionDetail
                            prediccionId={r.id}
                            onCerrar={() => setPrediccionSeleccionada(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20
          }}>
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina(p => p - 1)}
            >
              Anterior
            </button>

            <span>
              P?gina {pagina} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      <p style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>
        Las detecciones son experimentales y no constituyen
        confirmaci?n de un ataque.
      </p>
    </section>
  );
}
