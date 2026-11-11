
import { useEffect, useState } from "react";
import "./NetworkHistory.css";

const LIMITE = 20;

function NetworkHistory() {
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [actualizacion, setActualizacion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(
          `/api/live/history?limite=${LIMITE}&pagina=${pagina}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error("No fue posible consultar las conexiones.");
        }

        const datos = await respuesta.json();
        setRegistros(datos.records || []);
        setTotal(datos.total || 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => controlador.abort();
  }, [pagina, actualizacion]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  function fecha(valor) {
    return valor ? new Date(valor).toLocaleString("es-CO") : "—";
  }

  function numero(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
  }

  function duracion(valor) {
    return `${Number(valor || 0).toFixed(2)} s`;
  }

    function actualizar() {
        if (pagina !== 1) {
            setPagina(1);
        } else {
            setActualizacion((valor) => valor + 1);
        }
    }

  return (
    <section className="pk-network-history">
      <div className="pk-network-header">
        <div>
          <span className="pk-eyebrow">TRÁFICO ALMACENADO</span>
          <h2>Historial de conexiones</h2>
          <p>
            Consulta las conexiones capturadas automáticamente
            por el monitor de ProtecKey.
          </p>
        </div>

        <button type="button" onClick={actualizar} disabled={cargando}>
          Actualizar
        </button>
      </div>

      <div className="pk-network-stats">
        <div>
          <span>Conexiones registradas</span>
          <strong>{numero(total)}</strong>
        </div>
        <div>
          <span>Registros por página</span>
          <strong>{LIMITE}</strong>
        </div>
        <div>
          <span>Almacenamiento</span>
          <strong>PostgreSQL</strong>
        </div>
      </div>

      {cargando && <p className="pk-network-message">Cargando conexiones...</p>}

      {error && <p className="pk-network-error" role="alert">{error}</p>}

      {!cargando && !error && registros.length === 0 && (
        <p className="pk-network-message">
          Todavía no hay conexiones registradas.
        </p>
      )}

      {!cargando && !error && registros.length > 0 && (
        <>
          <div className="pk-network-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Protocolo</th>
                  <th>Paquetes</th>
                  <th>Bytes</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td>{fecha(registro.fecha_hora)}</td>
                    <td>
                      {registro.ip_origen}:{registro.puerto_origen}
                    </td>
                    <td>
                      {registro.ip_destino}:{registro.puerto_destino}
                    </td>
                    <td>
                      <span className="pk-network-protocol">
                        {String(registro.protocolo || "—").toUpperCase()}
                      </span>
                    </td>
                    <td>{numero(registro.paquetes)}</td>
                    <td>{numero(registro.bytes)}</td>
                    <td>{duracion(registro.duracion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pk-network-pagination">
            <span>
              Página {pagina} de {totalPaginas}
            </span>

            <div>
              <button
                type="button"
                disabled={pagina <= 1 || cargando}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={pagina >= totalPaginas || cargando}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default NetworkHistory;
