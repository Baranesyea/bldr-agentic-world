/**
 * Image Store — saves images to IndexedDB instead of localStorage
 * to avoid the 5MB localStorage quota limit.
 */

const DB_NAME = "bldr_images";
const STORE_NAME = "images";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save an image (data URL or external URL) with a unique key */
export async function saveImage(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, data: dataUrl, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get an image by key */
export async function getImage(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror = () => reject(req.error);
  });
}

/** Delete an image by key */
export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Save a data URL image to IndexedDB and return a reference key.
 * If the URL is already an external URL (not data:), just return it as-is.
 */
export async function storeImageIfDataUrl(dataUrl: string, prefix: string = "img"): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await saveImage(id, dataUrl);
  return `idb://${id}`;
}

/**
 * Resolve an image URL — if it's an idb:// reference, load from IndexedDB.
 * Otherwise return the URL as-is.
 */
export async function resolveImageUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("idb://")) {
    const id = url.slice(6);
    const data = await getImage(id);
    return data || "";
  }
  return url;
}
