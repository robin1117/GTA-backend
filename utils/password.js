import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, keyLength);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedPassword) {
  if (!storedPassword?.startsWith("scrypt:")) {
    return false;
  }

  const [, salt, storedKey] = storedPassword.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, keyLength);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}
