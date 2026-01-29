import CryptoJS from "crypto-js";

// Encrypt string or JSON
export function encryptJson(value) {
  const SECRET_KEY = process.env.ENCRYPTION_KEY_SECRET;
  if (!SECRET_KEY) throw new Error("ENCRYPTION_KEY_SECRET is not set");

  const plain = typeof value === "string" ? value : JSON.stringify(value);
  const encrypted = CryptoJS.AES.encrypt(plain, SECRET_KEY).toString();
  return encrypted;
}

// Decrypt string or JSON
export function decryptToJson(encrypted) {
  const SECRET_KEY = process.env.ENCRYPTION_KEY_SECRET;
  if (!SECRET_KEY) throw new Error("ENCRYPTION_KEY_SECRET is not set");

  if (!encrypted) return null;
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
