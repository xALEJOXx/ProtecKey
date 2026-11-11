const fs = require("node:fs");
const crypto = require("node:crypto");

const archivo = "secure-access/.env";

if (!fs.existsSync(archivo)) {
  console.error("Primero debes generar el archivo secure-access/.env.");
  process.exit(1);
}

const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Escribe la nueva contrasena: ", (password) => {
  if (password.length < 12) {
    console.log("La contrasena debe tener al menos 12 caracteres.");
    rl.close();
    return;
  }

  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  let contenido = fs.readFileSync(archivo, "utf8");

  contenido = contenido
    .replace(/^EVALUATOR_PASSWORD_SALT=.*$/m, `EVALUATOR_PASSWORD_SALT=${salt}`)
    .replace(/^EVALUATOR_PASSWORD_HASH=.*$/m, `EVALUATOR_PASSWORD_HASH=${hash}`);

  fs.writeFileSync(archivo, contenido, "utf8");

  console.log("Contrasena actualizada correctamente.");
  rl.close();
});
