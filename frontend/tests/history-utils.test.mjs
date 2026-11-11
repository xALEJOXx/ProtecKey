import test from "node:test";
import assert from "node:assert/strict";
import { filterEvents, newestFirst } from "../src/components/history-utils.js";
// Isolated fixtures for filter logic; never served or rendered by the application.
const events = [
  {
    id: 1,
    fecha_hora: "2026-01-02T12:00:00",
    prediccion: 0,
    protocolo: "TCP",
    ip_origen: "192.0.2.1",
  },
  {
    id: 2,
    fecha_hora: "2026-01-03T12:00:00",
    prediccion: "1",
    protocolo: "UDP",
    ip_destino: "192.0.2.2",
  },
  { id: 3, fecha_hora: null, prediccion: null },
];
test("combines case insensitive search, result and local date", () => {
  assert.deepEqual(
    filterEvents(events, {
      search: " udp ",
      result: "1",
      date: "2026-01-03",
    }).map((r) => r.id),
    [2],
  );
});
test("search matches an address and empty filters retain all records", () => {
  assert.equal(filterEvents(events, { search: "192.0.2.1" }).length, 1);
  assert.equal(filterEvents(events).length, 3);
});
test("missing prediction is never classified as normal", () => {
  assert.deepEqual(
    filterEvents(events, { result: "0" }).map((r) => r.id),
    [1],
  );
});
test("unmatched combinations return an empty result", () => {
  assert.equal(filterEvents(events, { search: "TCP", result: "1" }).length, 0);
});
test("chronology sorts a copy, newest first, without mutating the source", () => {
  assert.deepEqual(
    newestFirst(events).map((r) => r.id),
    [2, 1, 3],
  );
  assert.deepEqual(
    events.map((r) => r.id),
    [1, 2, 3],
  );
});
