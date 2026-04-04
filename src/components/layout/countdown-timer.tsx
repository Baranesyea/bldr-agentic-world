"use client";

import React, { useState, useEffect } from "react";
import { PricingPopup } from "@/components/ui/pricing-popup";

interface CountdownTimerProps {
  expiresAt: string;
}

function getTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getTimeRemaining(expiresAt));
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(expiresAt));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!remaining) return null;

  const timeText = remaining.days > 0
    ? `${remaining.days} ימים ${remaining.hours} שעות`
    : `${remaining.hours} שעות ${remaining.minutes} דקות`;

  return (
    <>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 16px",
        background: "rgba(255,179,0,0.06)",
        border: "1px solid rgba(255,179,0,0.15)",
        borderRadius: "4px",
        fontSize: "13px",
        direction: "rtl",
      }}>
        <span style={{ color: "rgba(240,240,245,0.7)" }}>
          המערכת זמינה לך לעוד:
        </span>
        <span style={{ color: "#FFB300", fontWeight: 600 }}>
          {timeText}
        </span>
        <button
          onClick={() => setShowPricing(true)}
          style={{
            background: "linear-gradient(135deg, #1a1aff, #4444ff)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            marginRight: "4px",
          }}
        >
          הרשמה למועדון
        </button>
      </div>
      {showPricing && <PricingPopup onClose={() => setShowPricing(false)} />}
    </>
  );
}
