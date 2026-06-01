const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ITERATIONS = 250000;

export async function deriveKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(
  text: string,
  key: CryptoKey
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(text)
  );

  return {
    iv: Array.from(iv),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

export async function decryptData(
  encryptedData: string,
  iv: number[],
  key: CryptoKey
) {
  const encryptedBytes = Uint8Array.from(
    atob(encryptedData),
    c => c.charCodeAt(0)
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    encryptedBytes
  );

  return decoder.decode(decrypted);
}