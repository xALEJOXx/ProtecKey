import crypto from "node:crypto";

const SESSION_DURATION = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 5 * 60 * 1000;

const sessions = new Map();
const failedAttempts = [];

export function createMonitorSecurity(passwordConfig) {
  const expected = Buffer.from(passwordConfig.hash, "base64");
  const salt = Buffer.from(passwordConfig.salt, "base64");

  function verifyPassword(password) {
    if (typeof password !== "string" || !password) {
      return false;
    }

    const calculated = crypto.pbkdf2Sync(
      password,
      salt,
      passwordConfig.iterations,
      expected.length,
      "sha256"
    );

    return crypto.timingSafeEqual(calculated, expected);
  }

  function login(password) {
    const now = Date.now();

    while (
      failedAttempts.length &&
      now - failedAttempts[0] > ATTEMPT_WINDOW
    ) {
      failedAttempts.shift();
    }

    if (failedAttempts.length >= MAX_ATTEMPTS) {
      return { status: 429, error: "Demasiados intentos." };
    }

    if (!verifyPassword(password)) {
      failedAttempts.push(now);
      return { status: 401, error: "Credenciales incorrectas." };
    }

    failedAttempts.length = 0;

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, now + SESSION_DURATION);

    return { status: 200, token, expiresIn: 1800 };
  }

  function authorize(token) {
    if (typeof token !== "string" || !token) {
      return false;
    }

    const now = Date.now();

    for (const [key, expiry] of sessions) {
      if (expiry <= now) {
        sessions.delete(key);
      }
    }

    for (const [key, expiry] of sessions) {
      const a = Buffer.from(key);
      const b = Buffer.from(token);

      if (
        a.length === b.length &&
        crypto.timingSafeEqual(a, b) &&
        expiry > now
      ) {
        return true;
      }
    }

    return false;
  }

  function logout(token) {
    if (authorize(token)) {
      sessions.delete(token);
    }
  }

  return { login, authorize, logout };
}
