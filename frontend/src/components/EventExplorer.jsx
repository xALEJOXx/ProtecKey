export function EventFilters({
  filters,
  onChange,
  view,
  onView,
  detection,
  count,
  total,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="soc-filter-bar">
      <label>
        Buscar en esta página
        <input
          type="search"
          placeholder="IP, ID o protocolo…"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
        />
      </label>
      <label>
        Fecha local
        <input
          type="date"
          value={filters.date}
          onChange={(e) => update("date", e.target.value)}
        />
      </label>
      {detection && (
        <label>
          Clasificación
          <select
            value={filters.result}
            onChange={(e) => update("result", e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="0">Normal</option>
            <option value="1">Sospechosa</option>
          </select>
        </label>
      )}
      <div
        className="soc-history-view-toggle"
        aria-label="Presentación del historial"
      >
        <button onClick={() => onView("table")} aria-pressed={view === "table"}>
          Tabla
        </button>
        <button
          onClick={() => onView("timeline")}
          aria-pressed={view === "timeline"}
        >
          Cronología
        </button>
      </div>
      <button onClick={() => onChange({ search: "", date: "", result: "all" })}>
        Restablecer
      </button>
      <p>
        {count} coincidencias en {total} registros cargados. Los filtros se
        aplican a la página actual.
      </p>
    </div>
  );
}
export function EventTimeline({ records, detection, onDetail }) {
  if (!records.length)
    return (
      <div className="soc-empty">
        No hay eventos que coincidan con los filtros.
      </div>
    );
  return (
    <div className="soc-timeline">
      {records.map((r) => (
        <details key={r.id}>
          <summary>
            #{r.id} · {r.protocolo || "Sin protocolo"} ·{" "}
            {detection
              ? Number(r.prediccion) === 1
                ? "Posible amenaza"
                : "Normal"
              : "Conexión observada"}
            <span>
              {r.fecha_hora
                ? new Date(r.fecha_hora).toLocaleString("es-CO")
                : "Fecha no disponible"}
            </span>
          </summary>
          <div className="soc-timeline-content">
            <p>
              {r.ip_origen}:{r.puerto_origen} → {r.ip_destino}:
              {r.puerto_destino}
            </p>
            {detection ? (
              <>
                <p>
                  Probabilidad estimada:{" "}
                  {r.probabilidad_ataque == null
                    ? "No disponible"
                    : `${(Number(r.probabilidad_ataque) * 100).toFixed(2)} %`}
                </p>
                <button onClick={() => onDetail(r.id)}>
                  Inspeccionar detección →
                </button>
              </>
            ) : (
              <p>
                Paquetes: {r.paquetes ?? "—"} · Bytes: {r.bytes ?? "—"} ·
                Duración: {r.duracion ?? "—"} s
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
