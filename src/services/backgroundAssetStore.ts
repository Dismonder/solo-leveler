const DB_NAME = "solo-leveler-background-assets";
const STORE_NAME = "mini-game-backgrounds";
const DB_VERSION = 1;

export type StoredBackgroundAsset = {
  id: string;
  dataUrl: string;
  createdAt: string;
};

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMiniGameBackgroundAsset(asset: StoredBackgroundAsset): Promise<void> {
  const db = await openStore();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(asset);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function getMiniGameBackgroundAsset(id: string): Promise<StoredBackgroundAsset | null> {
  const db = await openStore();
  const result = await new Promise<StoredBackgroundAsset | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as StoredBackgroundAsset | undefined) || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
