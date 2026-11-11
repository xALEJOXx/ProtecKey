export function filterEvents(
  records,
  { search = "", result = "all", date = "" } = {},
) {
  const query = search.trim().toLowerCase();
  return records.filter((r) => {
    const prediction = r.prediccion ?? r.prediction;
    const timestamp = new Date(r.fecha_hora || NaN);
    const localDate = Number.isNaN(timestamp.getTime())
      ? ""
      : `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, "0")}-${String(timestamp.getDate()).padStart(2, "0")}`;
    return (
      (result === "all" ||
        (prediction != null && Number(prediction) === Number(result))) &&
      (!date || localDate === date) &&
      (!query ||
        [
          r.id,
          r.ip_origen,
          r.ip_destino,
          r.protocolo,
          r.classification,
          r.fecha_hora,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        ))
    );
  });
}
export function newestFirst(records) {
  return [...records].sort(
    (a, b) => (Date.parse(b.fecha_hora) || 0) - (Date.parse(a.fecha_hora) || 0),
  );
}
