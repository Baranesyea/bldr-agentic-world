"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkTrialStatus, type TrialStatus } from "@/lib/trial-guard";

export function TrialBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    const s = checkTrialStatus();
    if (s.isOnTrial) {
      if (s.isExpired) {
        router.push("/trial-expired");
      } else {
        setStatus(s);
      }
    }
  }, [router]);

  if (!status || !status.isOnTrial || status.isExpired) return null;

  const urgent = status.isExpiringSoon;

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      background: urgent
        ? "linear-gradient(90deg, #dc2626, #b91c1c)"
        : "linear-gradient(90deg, #1e1b4b, #0000FF)",
      color: "#fff",
      fontSize: "13px",
      fontWeight: 500,
      paddingInline: "16px",
    }}>
      <span>
        {urgent
          ? `התקופה מסתיימת בעוד ${status.daysRemaining} ימים!`
          : `תקופת ניסיון: נשארו ${status.daysRemaining} ימים`}
      </span>
      <button
        onClick={() => router.push("/trial-expired")}
        style={{
          padding: "4px 14px",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.3)",
          background: urgent ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {urgent ? "הצטרף עכשיו" : "הצטרף למנוי"}
      </button>
    </div>
  );
}
