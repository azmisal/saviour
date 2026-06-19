const DB_NAME = 'saviour_crypto_db';
const STORE_NAME = 'crypto_store';
const KEY_ID = 'master_key';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(request.error);
  });
}

export async function saveCryptoKey(key: CryptoKey) {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');

    tx.objectStore(STORE_NAME).put(key, KEY_ID);

    tx.oncomplete = () => resolve();

    tx.onerror = () => reject(tx.error);
  });
}

export async function getCryptoKey(): Promise<CryptoKey | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');

    const request = tx.objectStore(STORE_NAME).get(KEY_ID);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function clearCryptoKey() {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');

    tx.objectStore(STORE_NAME).delete(KEY_ID);

    tx.oncomplete = () => resolve();

    tx.onerror = () => reject(tx.error);
  });
}