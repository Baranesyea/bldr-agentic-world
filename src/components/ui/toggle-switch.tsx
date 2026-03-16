"use client";

import { useState } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeColor?: string;
  size?: "sm" | "md";
}

export function ToggleSwitch({ checked, onChange, activeColor = "#3333FF", size = "md" }: ToggleSwitchProps) {
  const [pressed, setPressed] = useState(false);

  const w = size === "sm" ? 40 : 48;
  const h = size === "sm" ? 22 : 26;
  const thumbSize = size === "sm" ? 16 : 20;
  const pad = (h - thumbSize) / 2;
  const travel = w - thumbSize - pad * 2;

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: w,
        height: h,
        borderRadius: h,
        border: "none",
        cursor: "pointer",
        position: "relative",
        background: checked
          ? `linear-gradient(135deg, ${activeColor}, ${activeColor}dd)`
          : "rgba(255,255,255,0.1)",
        transition: "background 0.4s ease, box-shadow 0.4s ease",
        boxShadow: checked ? `0 0 12px ${activeColor}40` : "none",
        padding: 0,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Track inner glow when active */}
      <div style={{
        position: "absolute",
        inset: 1,
        borderRadius: h,
        background: checked
          ? `linear-gradient(180deg, ${activeColor}20 0%, transparent 100%)`
          : "transparent",
        transition: "background 0.4s",
      }} />

      {/* Thumb */}
      <div style={{
        width: thumbSize,
        height: thumbSize,
        borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: pad,
        left: checked ? pad + travel : pad,
        transition: "left 0.4s cubic-bezier(0.68, -0.3, 0.265, 1.3), transform 0.15s",
        transform: pressed ? "scale(0.88)" : "scale(1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.1)",
      }}>
        {/* Thumb shine */}
        <div style={{
          position: "absolute",
          inset: 1,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.6) 100%)",
        }} />

        {/* Status dot */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: checked ? 5 : 4,
          height: checked ? 5 : 4,
          borderRadius: "50%",
          background: checked ? activeColor : "rgba(150,150,150,0.4)",
          transition: "all 0.4s",
        }} />
      </div>
    </button>
  );
}
