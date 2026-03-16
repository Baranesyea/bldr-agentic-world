"use client";

import React from "react";
import Link from "next/link";
import { ChatIcon } from "@/components/ui/icons";

export default function ChatPage() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "32px" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ marginBottom: "20px", color: "rgba(240,240,245,0.2)" }}>
          <ChatIcon size={56} />
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
          צ&apos;אט צוותי
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.5)", marginBottom: "24px", lineHeight: 1.6 }}>
          בקרוב — צ&apos;אט לצוותים
        </p>
        <Link
          href="/qa"
          style={{
            display: "inline-block",
            color: "#5555FF",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            background: "rgba(0,0,255,0.08)",
            border: "1px solid rgba(0,0,255,0.2)",
          }}
        >
          בינתיים, אפשר לשאול שאלות בפורום &larr;
        </Link>
      </div>
    </div>
  );
}
