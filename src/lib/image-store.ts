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
 * Compress an image data URL to max 1280px width, JPEG quality 0.8
 * to keep it under API body limits.
 */
async function compressImage(dataUrl: string, maxWidth = 1280, quality = 0.8): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  // Skip non-image data URLs (e.g. audio)
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Upload a data URL image to cloud storage and return the public URL.
 * Compresses images before upload to stay under API limits.
 * Falls back to IndexedDB if cloud upload fails.
 */
export async function storeImageIfDataUrl(dataUrl: string, prefix: string = "img"): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  // Compress images to reduce size
  const compressed = await compressImage(dataUrl);

  // Try cloud upload
  try {
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl: compressed,
        fileName: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch {}

  // Fallback to IndexedDB if cloud fails
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
