import { useEffect, useState } from "react";
import "./MonitorControls.css";

const API = "/api/monitor-control";

async function solicitar(ruta, opciones = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...opciones,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.error || "No se pudo completar la solicitud.");
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

export default function MonitorControls() {
  const [autorizado, setAutorizado] = useState(false);
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("desconocido");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function consultar() {
      try {
        const sesion = await solicitar("/session");

        if (!activo) return;

        setAutorizado(sesion.autorizado);

        if (sesion.autorizado) {
          const resultado = await solicitar("/status");
          if (activo) setEstado(resultado.estado);
        } else {
          setEstado("desconocido");
        }
      } catch {
        if (activo) {
          setEstado("desconocido");
          setAutorizado(false);
        }
      }
    }

    consultar();

    const intervalo = setInterval(consultar, 5000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  async function iniciarSesion(evento) {
    evento.preventDefault();
    setOcupado(true);
    setError("");
    setMensaje("");

    try {
      await solicitar("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clave }),
      });

      setClave("");
      setAutorizado(true);

      const resultado = await solicitar("/status");
      setEstado(resultado.estado);
      setMensaje("Sesión de operador iniciada correctamente.");
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  async function controlar(accion) {
    setOcupado(true);
    setError("");
    setMensaje("");

    try {
      const resultado = await solicitar(`/${accion}`, {
        method: "POST",
      });

      const actualizado = await solicitar("/status");
      setEstado(actualizado.estado);

      setMensaje(
        accion === "start"
          ? "Se envió la orden para iniciar el monitoreo."
          : "Se envió la orden para detener el monitoreo."
      );
    } catch (fallo) {
      if (fallo.status === 401) {
        setAutorizado(false);
        setEstado("desconocido");
      }
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  async function cerrarSesion() {
    setOcupado(true);
    setError("");
    setMensaje("");

    try {
      await solicitar("/logout", { method: "POST" });
      setAutorizado(false);
      setEstado("desconocido");
      setClave("");
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="pk-monitor-control">
      <div className="pk-monitor-control-heading">
        <div>
          <span className="pk-monitor-control-eyebrow">
            CONTROL DE CAPTURA
          </span>
          <h2>Monitor de red de Windows</h2>
          <p>
            Administra la captura de tráfico TCP y UDP directamente
            desde ProtecKey.
          </p>
        </div>

        <span className={`pk-monitor-indicator ${estado}`}>
          <span className="pk-monitor-indicator-dot" />
          {estado === "activo"
            ? "Captura activa"
            : estado === "inactivo"
              ? "Captura detenida"
              : "Estado desconocido"}
        </span>
      </div>

      {!autorizado ? (
        <form className="pk-monitor-login" onSubmit={iniciarSesion}>
          <label htmlFor="pk-monitor-password">
            Contraseña del operador
          </label>

          <div className="pk-monitor-login-row">
            <input
              id="pk-monitor-password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
              required
            />

            <button type="submit" disabled={ocupado || !clave}>
              {ocupado ? "Verificando..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      ) : (
        <div className="pk-monitor-buttons">
          <button
            type="button"
            className="pk-monitor-start"
            onClick={() => controlar("start")}
            disabled={ocupado || estado !== "inactivo"}
          >
            Iniciar monitoreo
          </button>

          <button
            type="button"
            className="pk-monitor-stop"
            onClick={() => controlar("stop")}
            disabled={ocupado || estado !== "activo"}
          >
            Detener monitoreo
          </button>

          <button
            type="button"
            className="pk-monitor-logout"
            onClick={cerrarSesion}
            disabled={ocupado}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {mensaje && (
        <p className="pk-monitor-message" role="status">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="pk-monitor-error" role="alert">
          {error}
        </p>
      )}

      <p className="pk-monitor-help">
        El estado de captura corresponde al proceso de Windows.
        Es independiente de la conexión del panel con el servidor.
      </p>
    </section>
  );
}
