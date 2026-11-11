import fs from "node:fs";
import crypto from "node:crypto";
import { createMonitorSecurity } from "./monitor-security.js";

const CONTROL_FILE = "/run/secrets/monitor_control_token";
const OPERATOR_FILE = "/run/secrets/monitor_operator";
const WINDOWS_API = "http://host.docker.internal:8765";

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 4096) {
        reject(new Error("Solicitud demasiado grande."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });

    req.on("error", reject);
  });
}

function cookies(req) {
  const result = {};

  for (const part of (req.headers.cookie || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0) {
      result[part.slice(0, index).trim()] =
        part.slice(index + 1).trim();
    }
  }

  return result;
}

export function monitorProxy() {
  const controlToken = fs.readFileSync(CONTROL_FILE, "utf8").trim();
  const operatorConfig = JSON.parse(
    fs.readFileSync(OPERATOR_FILE, "utf8")
  );

  if (!controlToken) {
    throw new Error("Falta el token de control del monitor.");
  }

  const security = createMonitorSecurity(operatorConfig);

  return {
    name: "proteckey-monitor-control",

    configureServer(server) {
      
      // Protecci?n de consultas ML y del historial de red.
      // Se ejecuta antes del proxy HTTP de Vite.
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const path = url.pathname;

        const protectedRead =
          (path === "/api/ml/stats" ||
           path === "/api/ml/history" ||
           path.startsWith("/api/ml/history/") ||
           path === "/api/ml/predictions" ||
           path.startsWith("/api/ml/predictions/") ||
           path === "/api/live/history" ||
           path.startsWith("/api/live/history/")) &&
          (req.method === "GET" || req.method === "HEAD");

        if (!protectedRead) {
          return next();
        }

        const host = req.headers.host || "";
        const origin = req.headers.origin;
        const expectedOrigin = `http://${host}`;

        if (
          !["127.0.0.1:5173", "localhost:5173"].includes(host) ||
          (origin && origin !== expectedOrigin)
        ) {
          return json(res, 403, {
            error: "Origen no autorizado."
          });
        }

        const session = cookies(req).pk_monitor_session;

        if (!security.authorize(session)) {
          return json(res, 401, {
            error: "Debes iniciar sesi?n para consultar el historial."
          });
        }

        return next();
      });

      server.middlewares.use("/api/monitor-control", async (req, res) => {
        const host = req.headers.host || "";
        const origin = req.headers.origin;
        const method = req.method;
        const expectedOrigin = `http://${host}`;

        if (
          !["127.0.0.1:5173", "localhost:5173"].includes(host) ||
          (method !== "GET" && origin !== expectedOrigin) || (origin && origin !== expectedOrigin)
        ) {
          return json(res, 403, { error: "Origen no autorizado." });
        }

        const path = (req.url || "").split("?")[0];
        const session = cookies(req).pk_monitor_session;

        if (method === "POST" && path === "/login") {
          try {
            const body = await readBody(req);
            const result = security.login(body.password);

            if (result.status !== 200) {
              return json(res, result.status, {
                error: result.error
              });
            }

            res.setHeader(
              "Set-Cookie",
              `pk_monitor_session=${result.token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=1800`
            );

            return json(res, 200, {
              estado: "autorizado",
              expires_in: result.expiresIn
            });
          } catch {
            return json(res, 400, { error: "Solicitud inválida." });
          }
        }

        if (method === "GET" && path === "/session") {
          return json(res, 200, {
            autorizado: security.authorize(session)
          });
        }

        if (method === "POST" && path === "/logout") {
          security.logout(session);

          res.setHeader(
            "Set-Cookie",
            "pk_monitor_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0"
          );

          return json(res, 200, { estado: "sesion_cerrada" });
        }

        if (!security.authorize(session)) {
          return json(res, 401, {
            error: "Debes iniciar sesión para controlar el monitor."
          });
        }

        const routes = {
          "GET /status": "/local/status",
          "POST /start": "/local/start",
          "POST /stop": "/local/stop"
        };

        const target = routes[`${method} ${path}`];

        if (!target) {
          return json(res, 404, { error: "Ruta no encontrada." });
        }

        try {
          const response = await fetch(WINDOWS_API + target, {
            method,
            headers: {
              "X-Control-Token": controlToken
            },
            signal: AbortSignal.timeout(15000)
          });

          const result = await response.json();

          return json(res, response.status, result);
        } catch {
          return json(res, 502, {
            error: "No fue posible comunicarse con el monitor de Windows."
          });
        }
      });
    }
  };
}
