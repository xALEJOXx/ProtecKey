import { useEffect, useRef, useState } from "react";
import { useLiveMonitor } from "./LiveMonitorContext";
import "./NetworkPulse.css";

const VENTANA = 60;
const ANCHO = 900;
const ALTO = 220;

export default function NetworkPulse() {
  const { estado, flujos, totalRecibidos } = useLiveMonitor();
  const canvasRef = useRef(null);
  const datosRef = useRef(Array(VENTANA).fill(0));
  const pendientesRef = useRef(0);
  const ultimoIdRef = useRef(null);
  const [muestra, setMuestra] = useState(0);

  useEffect(() => {
    if (flujos.length === 0) return;

    const nuevos = [];
    for (const flujo of flujos) {
      if (flujo.id === ultimoIdRef.current) break;
      nuevos.push(flujo);
    }

    ultimoIdRef.current = flujos[0].id;

    const paquetes = nuevos.reduce(
      (total, flujo) =>
        total +
        (Number(flujo.spkts) || 0) +
        (Number(flujo.dpkts) || 0),
      0
    );

    pendientesRef.current += paquetes;
  }, [flujos]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const cantidad = pendientesRef.current;
      pendientesRef.current = 0;

      datosRef.current = [
        ...datosRef.current.slice(1),
        cantidad
      ];

      setMuestra((valor) => valor + 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const datos = datosRef.current;
    const maximo = Math.max(10, ...datos);

    ctx.clearRect(0, 0, ANCHO, ALTO);

    ctx.strokeStyle = "rgba(80, 140, 180, 0.15)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= ANCHO; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ALTO);
      ctx.stroke();
    }

    for (let y = 0; y <= ALTO; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ANCHO, y);
      ctx.stroke();
    }

    const puntos = datos.map((valor, indice) => ({
      x: (indice / (VENTANA - 1)) * ANCHO,
      y: ALTO - 15 - (valor / maximo) * (ALTO - 35)
    }));

    ctx.beginPath();
    puntos.forEach((punto, indice) => {
      if (indice === 0) ctx.moveTo(punto.x, punto.y);
      else ctx.lineTo(punto.x, punto.y);
    });

    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const ultimo = puntos[puntos.length - 1];

    ctx.beginPath();
    ctx.arc(ultimo.x, ultimo.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#67e8f9";
    ctx.fill();
  }, [muestra]);

  const conectado = estado === "Conectado";
  const ultimoValor = datosRef.current[VENTANA - 1];

  return (
    <section className="pk-pulse">
      <div className="pk-pulse-header">
        <div>
          <span className="pk-pulse-eyebrow">
            TELEMETRÍA DE RED
          </span>
          <h2>Network Pulse</h2>
          <p>
            Actividad de paquetes asociada a los flujos
            recibidos durante los últimos 60 segundos.
          </p>
        </div>

        <div className={`pk-pulse-status ${
          conectado ? "online" : "offline"
        }`}>
          <span className="pk-pulse-dot" />
          {conectado ? "Conectado" : estado}
        </div>
      </div>

      <div className="pk-pulse-chart">
        <canvas
          ref={canvasRef}
          width={ANCHO}
          height={ALTO}
          aria-label="Gráfica de actividad de red"
          role="img"
        />
      </div>

      <div className="pk-pulse-footer">
        <span>
          <i className="pk-pulse-legend" />
          Paquetes reportados por intervalo
        </span>
        <span>
          Último intervalo: <strong>{ultimoValor}</strong>
        </span>
        <span>
          Flujos recibidos en sesión:
          <strong> {totalRecibidos}</strong>
        </span>
      </div>
    </section>
  );
}
