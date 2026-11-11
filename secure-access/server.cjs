const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const envPath = path.join(__dirname, ".env");

for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const PORT = Number(process.env.PORT || 5180);
const TARGET = process.env.PROTECKEY_URL;
const SALT = process.env.EVALUATOR_PASSWORD_SALT;
const HASH = process.env.EVALUATOR_PASSWORD_HASH;
const SECRET = process.env.SESSION_SECRET;

if (!TARGET || !SALT || !HASH || !SECRET) {
  throw new Error("Configuracion de seguridad incompleta");
}

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", "loopback");

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.urlencoded({ extended: false, limit: "4kb" }));

const sessionMiddleware = session({
  name: "proteckey.sid",
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: "auto",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

function paginaLogin(error = "") {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acceso seguro | ProtecKey</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;
background:linear-gradient(135deg,#071426,#102b43);font-family:Arial,sans-serif;color:#fff}
.card{width:min(420px,92%);padding:38px;background:#12263d;
border:1px solid #29445d;border-radius:18px;box-shadow:0 20px 60px #0005}
.logo{font-size:34px;color:#5ed4ff;text-align:center}
h1{text-align:center;margin:12px 0 8px}
p{text-align:center;color:#aebed0;line-height:1.5}
label{display:block;margin:26px 0 8px}
input{width:100%;padding:14px;background:#071426;border:1px solid #3b5a75;
border-radius:9px;color:white;font-size:16px}
button{width:100%;margin-top:20px;padding:14px;border:0;border-radius:9px;
background:#36b8e9;color:#061421;font-weight:bold;font-size:16px;cursor:pointer}
.error{color:#ff9292;font-size:14px;margin-top:14px}
small{display:block;text-align:center;color:#849aaf;margin-top:24px}
</style>
</head>
<body>
<div class="card">
<div class="logo">◆</div>
<h1>ProtecKey</h1>
<p>Plataforma inteligente de análisis y monitoreo de seguridad</p>
<form method="POST" action="/login">
<label for="password">Contraseña de acceso</label>
<input id="password" name="password" type="password"
required autocomplete="current-password" autofocus>
<button type="submit">Ingresar a ProtecKey</button>
</form>
${error ? '<p class="error">Contraseña incorrecta o demasiados intentos.</p>' : ""}
<small>Acceso exclusivo para evaluadores autorizados</small>
</div>
</body>
</html>`;
}

function autenticado(req) {
  return req.session && req.session.autenticado === true;
}

app.get("/login", (req, res) => {
  if (autenticado(req)) return res.redirect("/");
  res.set("Cache-Control", "no-store");
  res.send(paginaLogin(req.query.error));
});

const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Demasiados intentos. Espera 15 minutos."
});

app.post("/login", limitarLogin, (req, res) => {
  const password = String(req.body.password || "");
  const esperado = Buffer.from(HASH, "hex");
  const recibido = crypto.scryptSync(password, SALT, esperado.length);

  if (!crypto.timingSafeEqual(esperado, recibido)) {
    return res.redirect("/login?error=1");
  }

  req.session.regenerate((error) => {
    if (error) return res.sendStatus(500);

    req.session.autenticado = true;

    req.session.save((error) => {
      if (error) return res.sendStatus(500);
      res.redirect("/");
    });
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("proteckey.sid");
    res.redirect("/login");
  });
});

app.use((req, res, next) => {
  if (autenticado(req)) return next();

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      detail: "Autenticacion requerida"
    });
  }

  return res.redirect("/login");
});

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  on: {
    proxyReq: (proxyReq, req) => {
      const origin = req.headers.origin;
      const publicOrigin = `http://${req.headers.host}`;
      const targetOrigin = new URL(TARGET).origin;

      if (origin === publicOrigin) {
        proxyReq.setHeader("Origin", targetOrigin);
      }
    }
  }
});

app.use(proxy);

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  sessionMiddleware(req, {}, (error) => {
    if (error || !autenticado(req)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    proxy.upgrade(req, socket, head);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("ProtecKey - Acceso seguro activo");
  console.log(`http://127.0.0.1:${PORT}`);
});


