import { useState } from "react";
const sources = [
  ["ml", "Detecciones ML", "01"],
  ["network", "Conexiones de red", "02"],
  ["batch", "Archivos por lotes", "03"],
  ["individual", "Análisis individuales", "04"],
];
export default function HistoryWorkspace({ individual, network, ml, batch }) {
  const [source, setSource] = useState("ml");
  return (
    <div className="soc-history-workspace">
      <div
        className="soc-source-tabs"
        role="tablist"
        aria-label="Fuente del historial"
      >
        {sources.map(([key, label, n]) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            aria-selected={source === key}
            aria-controls="history-content"
            onClick={() => setSource(key)}
          >
            <span>{n}</span>
            {label}
          </button>
        ))}
      </div>
      <div
        id="history-content"
        role="tabpanel"
        aria-labelledby={`tab-${source}`}
        className="soc-history-content"
      >
        {{ individual, network, ml, batch }[source]}
      </div>
    </div>
  );
}
