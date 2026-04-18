"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubscriptionStatus {
  cancellationRequestedAt: string | null;
  cancellationEffectiveAt: string | null;
  daysRemaining: number | null;
}

export function CancellationBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  if (!status?.cancellationRequestedAt) return null;

  const days = status.daysRemaining ?? 0;

  return (
    <div
      style={{
        background: "rgba(239,68,68,0.12)",
        borderBottom: "1px solid rgba(239,68,68,0.3)",
        color: "#fca5a5",
        padding: "10px 16px",
        textAlign: "center",
        fontSize: 13,
        direction: "rtl",
        display: "flex",
        gap: 12,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: 600 }}>
        המנוי בוטל, נשארו עוד {days} {days === 1 ? "יום" : "ימים"} לשימוש
      </span>
      <Link
        href="/profile"
        style={{
          color: "#60a5fa",
          textDecoration: "none",
          fontWeight: 700,
          border: "1px solid rgba(96,165,250,0.4)",
          padding: "4px 12px",
          borderRadius: 4,
        }}
      >
        החלטתי להישאר
      </Link>
    </div>
  );
}
