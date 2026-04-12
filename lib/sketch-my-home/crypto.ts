/**
 * crypto.ts - Project File Encryption Utility
 * Ported from legacy/crypto.js to maintain file parity with .rproj format.
 */

const BASIC_KEY = 'Sk3tchMyH0m3-2026-FloorPlan-Designer';
const HEADER_PREFIX = 'SKETCH_MY_HOME_ENC:';

function xorEncrypt(plaintext: string, key: string): Uint8Array {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(key);
  const textBytes = enc.encode(plaintext);
  const result = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const SketchMyHomeCrypto = {
  isEncrypted(content: string): boolean {
    return typeof content === 'string' && content.startsWith(HEADER_PREFIX);
  },

  encrypt(plaintext: string): string {
    const encrypted = xorEncrypt(plaintext, BASIC_KEY);
    return `${HEADER_PREFIX}basic:${uint8ToBase64(encrypted)}`;
  },

  decrypt(content: string): string {
    if (!this.isEncrypted(content)) return content;
    
    const strategy = content.startsWith(`${HEADER_PREFIX}basic:`) ? 'basic' : null;
    if (!strategy) throw new Error('Unknown encryption strategy');

    const headerLen = `${HEADER_PREFIX}${strategy}:`.length;
    const payload = content.substring(headerLen);
    
    const bytes = base64ToUint8(payload);
    const decryptedBytes = xorEncrypt(new TextDecoder().decode(bytes), BASIC_KEY);
    return new TextDecoder().decode(decryptedBytes);
  }
};
