import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypts a Buffer using AES-256-GCM.
 * @param data The data to encrypt.
 * @param key The 32-byte encryption key.
 * @returns The encrypted data including IV, salt, and tag.
 */
export function encrypt(data: Buffer, key: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create a proper key from the provided string (using PBKDF2 for better security)
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Result: [salt (16)] [iv (12)] [tag (16)] [encrypted data]
  return Buffer.concat([salt, iv, tag, encrypted]);
}

/**
 * Decrypts a Buffer using AES-256-GCM.
 * @param data The encrypted data (salt + iv + tag + content).
 * @param key The 32-byte encryption key.
 * @returns The decrypted data.
 */
export function decrypt(data: Buffer, key: string): Buffer {
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
