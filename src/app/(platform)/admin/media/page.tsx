"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { saveImage, getImage, deleteImage } from "@/lib/image-store";
import { ImportIcon } from "@/components/ui/icons";

interface MediaItem {
  id: string;
  label: string;
  key: string;
  createdAt: number;
  width?: number;
  height?: number;
}

const REGISTRY_KEY = "bldr_media_registry";

function loadRegistry(): MediaItem[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRegistry(items: MediaItem[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(items));
}

function MediaThumbnail({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    getImage(item.key).then((data) => {
      if (data) setSrc(data);
      else console.warn("Media image not found in IndexedDB:", item.key);
    }).catch((err) => console.error("Error loading media image:", item.key, err));
  }, [item.key]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      <div style={{ position: "relative", paddingBottom: "56.25%", background: "#0a0a2a" }}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={item.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {item.label}
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,240,245,0.35)", marginTop: 2 }}>
            {item.width && item.height ? `${item.width}x${item.height}` : "—"} · {new Date(item.createdAt).toLocaleDateString("he-IL")}
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          style={{
            background: "rgba(255,60,60,0.1)",
            border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 8,
            color: "#ff4444",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 12px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          מחק
        </button>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(loadRegistry());
  }, []);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const newItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Get dimensions
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUrl;
      });

      const key = `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await saveImage(key, dataUrl);

      newItems.push({
        id: key,
        label: file.name,
        key,
        createdAt: Date.now(),
        width: dims.width,
        height: dims.height,
      });
    }

    const updated = [...newItems, ...loadRegistry()];
    saveRegistry(updated);
    setItems(updated);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await deleteImage(item.key);
    const updated = items.filter((i) => i.id !== id);
    saveRegistry(updated);
    setItems(updated);
  }, [items]);

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 6 }}>ספריית מדיה</h1>
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)" }}>
            ניהול תמונות ממוזערות — העלאה, צפייה ומחיקה
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0000FF",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: uploading ? "wait" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <ImportIcon size={16} />
            {uploading ? "מעלה..." : "העלה תמונות"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 0",
          color: "rgba(240,240,245,0.3)",
          fontSize: 15,
        }}>
          אין תמונות בספרייה. לחץ על &quot;העלה תמונות&quot; כדי להתחיל.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {items.map((item) => (
            <MediaThumbnail key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
