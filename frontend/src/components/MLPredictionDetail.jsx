import { useEffect, useState } from "react";

const formatoPorcentaje = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? `${(numero * 100).toFixed(1)} %`
    : "Sin datos";
};

const texto = (valor) =>
  valor === null || valor === undefined || valor === ""
    ? "Sin datos"
    : String(valor);

const etiqueta = (valor) =>
  texto(valor).replaceAll("_", " ");

function Campo({ nombre, valor }) {
  return (
    <div style={{
      padding: 14,
      border: "1px solid #334155",
      borderRadius: 10,
      minWidth: 0
    }}>
      <div style={{
        color: "#94a3b8",
        fontSize: 12,
        marginBottom: 6
      }}>
        {nombre}
      </div>
      <div style={{
        fontWeight: 600,
        overflowWrap: "anywhere"
      }}>
        {texto(valor)}
      </div>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section style={{ marginTop: 22 }}>
      <h3 style={{
        color: "#38bdf8",
        fontSize: 16,
        marginBottom: 12
      }}>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Lista({ elementos, vacio }) {
  if (!Array.isArray(elementos) || elementos.length === 0) {
    return <p style={{ color: "#94a3b8" }}>{vacio}</p>;
  }

  return (
    <ul style={{ paddingLeft: 22, lineHeight: 1.7 }}>
      {elementos.map((elemento, indice) => (
        <li key={indice}>{texto(elemento)}</li>
      ))}
    </ul>
  );
}

export default function MLPredictionDetail({ prediccionId, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    setDetalle(null);
    setCargando(true);
    setError("");

    async function consultar() {
      try {
        const respuesta = await fetch(
          `/api/ml/predictions/${prediccionId}`,
          { signal: controlador.signal }
        );

        if (!respuesta.ok) {
          throw new Error(`HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!controlador.signal.aborted) {
          setDetalle(datos);
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(`No se pudo consultar la prediccion. ${err.message}`);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    consultar();

    return () => controlador.abort();
  }, [prediccionId]);

  const analisis = detalle?.analisis_amenaza || {};
  const inicio = analisis.inicio_conexion || {};
  const decision = analisis.decision_proteccion || {};
  const proteccion = analisis.proteccion_ip || {};

  const resultado = detalle?.protocolo === "TEST"
    ? "Prueba tecnica"
    : detalle?.prediccion === 1
      ? "Sospechoso"
      : "Normal";

  return (
    <div style={{
      marginTop: 20,
      padding: 22,
      border: "1px solid #475569",
      borderRadius: 14,
      background: "#0f172a",
      color: "#e2e8f0"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap"
      }}>
        <h2 style={{ margin: 0 }}>
          Detalle de prediccion #{prediccionId}
        </h2>

        <button type="button" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      {cargando && <p>Cargando informacion...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && detalle && (
        <>
          <Seccion titulo="Informacion de la conexion">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12
            }}>
              <Campo nombre="Protocolo" valor={detalle.protocolo} />
              <Campo
                nombre="IP de origen"
                valor={detalle.ip_origen}
              />
              <Campo
                nombre="Puerto de origen"
                valor={detalle.puerto_origen}
              />
              <Campo
                nombre="IP de destino"
                valor={detalle.ip_destino}
              />
              <Campo
                nombre="Puerto de destino"
                valor={detalle.puerto_destino}
              />
              <Campo
                nombre="Inicio TCP"
                valor={
                  detalle.protocolo?.toUpperCase() !== "TCP"
                    ? "No aplica"
                    : inicio.inicio
                      ? etiqueta(inicio.inicio)
                      : "Sin datos"
                }
              />
              <Campo
                nombre="Estado TCP"
                valor={inicio.estado_tcp}
              />
              <Campo
                nombre="IP remota identificada"
                valor={inicio.ip_remota}
              />
            </div>

            {inicio.motivo && (
              <p style={{ marginTop: 12, color: "#cbd5e1" }}>
                <strong>Explicacion del inicio:</strong> {inicio.motivo}
              </p>
            )}
          </Seccion>

          <Seccion titulo="Resultado del modelo">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12
            }}>
              <Campo nombre="Clasificacion" valor={resultado} />
              <Campo
                nombre="Probabilidad estimada"
                valor={formatoPorcentaje(detalle.probabilidad_ataque)}
              />
              <Campo
                nombre="Gravedad"
                valor={etiqueta(analisis.gravedad)}
              />
              <Campo
                nombre="Tipo de evaluacion"
                valor={detalle.experimental ? "Experimental" : "No experimental"}
              />
            </div>

            {analisis.descripcion && (
              <p style={{ marginTop: 12 }}>
                {analisis.descripcion}
              </p>
            )}
          </Seccion>

          <Seccion titulo="Evidencias registradas">
            <Lista
              elementos={analisis.evidencias}
              vacio="No se registraron evidencias adicionales."
            />
          </Seccion>

          <Seccion titulo="Recomendaciones de seguridad">
            <Lista
              elementos={analisis.recomendaciones}
              vacio="No hay recomendaciones registradas."
            />
          </Seccion>

          <Seccion titulo="Decision de proteccion">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12
            }}>
              <Campo
                nombre="Decision"
                valor={etiqueta(decision.decision)}
              />
              <Campo
                nombre="Accion propuesta"
                valor={decision.accion}
              />
              <Campo
                nombre="Modo"
                valor={etiqueta(decision.modo || analisis.modo)}
              />
              <Campo
                nombre="Bloqueo autorizado"
                valor={
                  decision.bloqueo_autorizado === true
                    ? "Si"
                    : "No"
                }
              />
              <Campo
                nombre="Bloqueo ejecutado"
                valor={
                  decision.bloqueo_ejecutado === true
                    ? "Si"
                    : "No"
                }
              />
              <Campo
                nombre="IP protegida"
                valor={
                  proteccion.protegida === true
                    ? "Si"
                    : proteccion.protegida === false
                      ? "No"
                      : "Sin datos"
                }
              />
            </div>

            {decision.motivo && (
              <p style={{ marginTop: 12 }}>
                <strong>Motivo de la decision:</strong> {decision.motivo}
              </p>
            )}
          </Seccion>

          <p style={{
            marginTop: 24,
            padding: 12,
            borderLeft: "3px solid #facc15",
            background: "#1e293b",
            fontSize: 13
          }}>
            Esta evaluacion es experimental. Una prediccion sospechosa
            no confirma un ataque. Las decisiones registradas no
            constituyen por si mismas una autorizacion para bloquear.
          </p>
        </>
      )}
    </div>
  );
}
