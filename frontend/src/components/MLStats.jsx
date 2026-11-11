import { useEffect, useState } from "react";
import "./MLStats.css";

const INTERVALO = 10000;

const TARJETAS = [
  {
    clave: "total",
    titulo: "Evaluaciones ML",
    descripcion: "Predicciones registradas",
    icono: "◎",
    estilo: "total",
  },
  {
    clave: "sospechosas",
    titulo: "Posibles amenazas",
    descripcion: "Clasificadas como sospechosas",
    icono: "!",
    estilo: "alerta",
  },
  {
    clave: "normales",
    titulo: "Tráfico normal",
    descripcion: "Clasificaciones normales",
    icono: "◎",
    estilo: "normal",
  },
  {
    clave: "gravedad_alta",
    titulo: "Gravedad alta / crítica",
    descripcion: "Según el análisis de amenaza",
    icono: "◎",
    estilo: "gravedad",
  },
];

export default function MLStats() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    let activo = true;
    let controlador = null;

    async function cargar() {
      if (controlador) controlador.abort();

      controlador = new AbortController();

      try {
        if (activo) setActualizando(true);

        const respuesta = await fetch("/api/ml/stats", {
          signal: controlador.signal,
          cache: "no-store",
        });

        if (!respuesta.ok) {
          throw new Error(`HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        const claves = ["total", "normales", "sospechosas", "gravedad_alta"];

        if (
          !claves.every(
            (clave) => Number.isInteger(datos[clave]) && datos[clave] >= 0,
          )
        ) {
          throw new Error("Respuesta de estadísticas no válida");
        }

        if (activo) {
          setEstadisticas(datos);
          setError("");
        }
      } catch (err) {
        if (activo && err.name !== "AbortError") {
          setError("No fue posible actualizar las estadísticas ML.");
        }
      } finally {
        if (activo) setActualizando(false);
      }
    }

    cargar();

    const intervalo = setInterval(cargar, INTERVALO);

    return () => {
      activo = false;
      clearInterval(intervalo);
      if (controlador) controlador.abort();
    };
  }, []);

  const formato = (numero) => Number(numero).toLocaleString("es-CO");

  return (
    <section className="pk-mlstats">
      <div className="pk-mlstats-header">
        <div>
          <span className="pk-mlstats-eyebrow">
            PROTECKEY · SECURITY OVERVIEW
          </span>
          <h2>Resumen de seguridad ML</h2>
          <p>
            Resultados acumulados de las evaluaciones registradas en PostgreSQL.
          </p>
        </div>

        <div className="pk-mlstats-status">
          <span className={error ? "pk-mlstats-dot error" : "pk-mlstats-dot"} />
          {error
            ? "Sin actualización"
            : actualizando
              ? "Actualizando"
              : "Datos sincronizados"}
        </div>
      </div>

      <div className="pk-mlstats-grid">
        {TARJETAS.map((tarjeta) => (
          <article
            key={tarjeta.clave}
            className={`pk-mlstats-card ${tarjeta.estilo}`}
          >
            <div className="pk-mlstats-card-top">
              <span>{tarjeta.titulo}</span>
              <span className="pk-mlstats-icon">{tarjeta.icono}</span>
            </div>

            <strong className="pk-mlstats-value">
              {estadisticas ? formato(estadisticas[tarjeta.clave]) : "—"}
            </strong>

            <span className="pk-mlstats-description">
              {tarjeta.descripcion}
            </span>
          </article>
        ))}
      </div>

      {error && (
        <p className="pk-mlstats-error" role="alert">
          {error}{" "}
          {estadisticas
            ? "Se conservan los últimos valores disponibles."
            : "No hay valores disponibles."}
        </p>
      )}

      <div className="pk-mlstats-footer">
        <span>Actualización automática cada 10 segundos</span>
        <span>
          Las predicciones ML son experimentales y no constituyen ataques
          confirmados.
        </span>
      </div>
    </section>
  );
}
