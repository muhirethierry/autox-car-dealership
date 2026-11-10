import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const COST = 2 ** 15;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  const [algorithm, costText, saltText, keyText] = String(encoded || "").split("$");
  if (algorithm !== "scrypt" || Number(costText) !== COST || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64url");
  const actual = await scrypt(password, Buffer.from(saltText, "base64url"), expected.length, { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createCsrfToken(session) {
  if (!session.csrfToken) session.csrfToken = randomBytes(32).toString("base64url");
  return session.csrfToken;
}

export function validCsrfToken(session, token) {
  if (typeof token !== "string" || !session.csrfToken) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(session.csrfToken);
  return a.length === b.length && timingSafeEqual(a, b);
}
