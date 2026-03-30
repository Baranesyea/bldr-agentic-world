"use client";

import { useEffect } from "react";

const SEED_VERSION_KEY = "bldr_seed_version";
const CURRENT_SEED_VERSION = "1";

export function SeedLoader() {
  useEffect(() => {
    const alreadySeeded = localStorage.getItem(SEED_VERSION_KEY);
    if (alreadySeeded === CURRENT_SEED_VERSION) return;

    (async () => {
      try {
        // 1. Load localStorage seed data
        const lsRes = await fetch("/seed-data/localStorage.json");
        if (!lsRes.ok) return;
        const lsData: Record<string, unknown> = await lsRes.json();

        for (const [key, value] of Object.entries(lsData)) {
          // Don't overwrite if user already has data for this key
          if (localStorage.getItem(key) !== null) continue;
          localStorage.setItem(
            key,
            typeof value === "string" ? value : JSON.stringify(value)
          );
        }

        // 2. Load IndexedDB images
        const manifestRes = await fetch("/seed-data/manifest.json");
        if (!manifestRes.ok) return;
        const manifest = await manifestRes.json();

        const DB_NAME = "bldr_images";
        const STORE_NAME = "images";
        const db: IDBDatabase = await new Promise((resolve, reject) => {
          const req = indexedDB.open(DB_NAME, 1);
          req.onupgradeneeded = () => {
            const d = req.result;
            if (!d.objectStoreNames.contains(STORE_NAME)) {
              d.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        for (let i = 0; i < manifest.idbImageCount; i++) {
          const imgRes = await fetch(`/seed-data/idb_image_${i}.json`);
          if (!imgRes.ok) continue;
          const imgData = await imgRes.json();
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).put(imgData);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }
        db.close();

        // Mark as seeded
        localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
        console.log("[SeedLoader] Seed data loaded successfully");
      } catch (e) {
        console.error("[SeedLoader] Failed to load seed data:", e);
      }
    })();
  }, []);

  return null;
}
