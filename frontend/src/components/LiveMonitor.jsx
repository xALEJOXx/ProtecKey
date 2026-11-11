
import { useState } from "react";
import { useLiveMonitor } from "./LiveMonitorContext";
import "./LiveMonitor.css";
import NetworkPulse from "./NetworkPulse";
import MLStats from "./MLStats";
import MonitorControls from "./MonitorControls";


export default function LiveMonitor() {
  const {
    estado,
    flujos,
    totalRecibidos,
    limpiarVista
  } = useLiveMonitor();

  const [filtro, setFiltro] = useState("todos");


  const visibles = flujos.filter(
    (flujo) => filtro === "todos" ||
      flujo.protocolo?.toLowerCase() === filtro
  );

  const paquetes = flujos.reduce(
    (total, flujo) => total + flujo.spkts + flujo.dpkts,
    0
  );

  const bytes = flujos.reduce(
    (total, flujo) => total + flujo.sbytes + flujo.dbytes,
    0
  );

  const tcp = flujos.filter(
    (flujo) => flujo.protocolo?.toLowerCase() === "tcp"
  ).length;

  const udp = flujos.filter(
    (flujo) => flujo.protocolo?.toLowerCase() === "udp"
  ).length;

  const formatoNumero = (valor) =>
    Number(valor).toLocaleString("es-CO");

  return (
    <div className="pk-live">
      <div className="pk-live-header">
        <div>
          <span className="pk-eyebrow">SUPERVISIÓN DE RED</span>
          <h1>Monitoreo en vivo</h1>
          <p>
            Observa las conexiones TCP y UDP capturadas
            por ProtecKey desde tu equipo.
          </p>
        </div>

        <div className={`pk-live-status ${
          estado === "Conectado" ? "online" : "offline"
        }`}>
          <span className="pk-live-status-dot" />
          {estado}
        </div>
      </div>

      <MonitorControls />

      <div className="pk-live-stats">
        <article className="pk-live-stat">
          <span>Flujos recibidos</span>
          <strong>{formatoNumero(totalRecibidos)}</strong>
          <small>Durante esta sesión de ProtecKey</small>
        </article>

        <article className="pk-live-stat">
          <span>Paquetes observados</span>
          <strong>{formatoNumero(paquetes)}</strong>
          <small>En los flujos visibles en memoria</small>
        </article>

        <article className="pk-live-stat">
          <span>Datos transferidos</span>
          <strong>{(bytes / 1024).toFixed(2)} KB</strong>
          <small>En los flujos conservados</small>
        </article>

        <article className="pk-live-stat">
          <span>Protocolos</span>
          <strong>{tcp} TCP / {udp} UDP</strong>
          <small>Últimos {flujos.length} flujos</small>
        </article>
      </div>

      <MLStats />

      <NetworkPulse />

      <section className="pk-live-panel">
        <div className="pk-live-panel-header">
          <div>
            <h2>Conexiones observadas</h2>
            <p>
              Los registros aparecen cuando el monitor
              de Windows los envía al API Gateway.
            </p>
          </div>

          <div className="pk-live-actions">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              aria-label="Filtrar protocolo"
            >
              <option value="todos">Todos</option>
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>

            <button
              type="button"
              onClick={limpiarVista}
            >
              Limpiar vista
            </button>
          </div>
        </div>

        <div className="pk-live-table-wrap">
          <table className="pk-live-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Protocolo</th>
                <th>Paquetes</th>
                <th>Bytes</th>
                <th>Estado TCP</th>
              </tr>
            </thead>

            <tbody>
              {visibles.map((flujo) => (
                <tr key={flujo.id}>
                  <td>
                    {new Date(flujo.fecha_hora)
                      .toLocaleTimeString("es-CO")}
                  </td>
                  <td>
                    {flujo.ip_origen}:{flujo.puerto_origen}
                  </td>
                  <td>
                    {flujo.ip_destino}:{flujo.puerto_destino}
                  </td>
                  <td>
                    <span className="pk-live-protocol">
                      {flujo.protocolo?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {formatoNumero(flujo.spkts + flujo.dpkts)}
                  </td>
                  <td>
                    {formatoNumero(flujo.sbytes + flujo.dbytes)}
                  </td>
                  <td>{flujo.estado_tcp || "No observado"}</td>
                </tr>
              ))}

              {visibles.length === 0 && (
                <tr>
                  <td colSpan="7" className="pk-live-empty">
                    Todavía no hay flujos para mostrar.
                    Inicia una captura desde el monitor
                    de Windows y espera su envío.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="pk-live-note">
        Esta vista muestra estadísticas de tráfico observado.
        No confirma ataques ni ejecuta predicciones del modelo.
        Conserva como máximo 200 flujos en memoria.
      </p>
    </div>
  );
}
