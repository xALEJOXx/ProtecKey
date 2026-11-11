const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

const carpeta = __dirname;
const archivo = path.join(carpeta, ".env");

if (fs.existsSync(archivo)) {
  console.error("Ya existe secure-access/.env. No se sobrescribio.");
  process.exit(1);
}

const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const bytes = crypto.randomBytes(24);

const password = Array.from(
  bytes,
  (numero) => caracteres[numero % caracteres.length]
).join("");

const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
const sessionSecret = crypto.randomBytes(48).toString("hex");

const contenido = [
  "PORT=5180",
  "PROTECKEY_URL=http://127.0.0.1:5173",
  "EVALUATOR_PASSWORD_SALT=" + salt,
  "EVALUATOR_PASSWORD_HASH=" + hash,
  "SESSION_SECRET=" + sessionSecret,
  ""
].join("\n");

fs.writeFileSync(archivo, contenido, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx"
});

console.log("");
console.log("CONFIGURACION CREADA CORRECTAMENTE");
console.log("");
console.log("CONTRASENA PARA EVALUADORES:");
console.log(password);
console.log("");
console.log("Guardala en un lugar privado.");
console.log("No compartas esta salida en el chat.");
