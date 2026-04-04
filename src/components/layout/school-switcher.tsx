"use client";

import React, { useState, useEffect, useRef } from "react";

interface School {
  membership: { schoolId: string };
  school: { id: string; name: string; slug: string };
}

interface SchoolSwitcherProps {
  userId: string;
  activeSchoolId: string | null;
  collapsed?: boolean;
}

export function SchoolSwitcher({ userId, activeSchoolId, collapsed }: SchoolSwitcherProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch(`/api/schools`);
        const allSchools = await res.json();
        if (Array.isArray(allSchools) && allSchools.length > 0) {
          // For now, show all schools. In the future, filter by user membership.
          setSchools(
            allSchools.map((s: { id: string; name: string; slug: string }) => ({
              membership: { schoolId: s.id },
              school: s,
            }))
          );
        }
      } catch {}
      setLoading(false);
    }
    fetchSchools();
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading || schools.length === 0) return null;
  if (schools.length === 1) return null; // No switcher needed for single school

  const active = schools.find((s) => s.school.id === activeSchoolId);
  const label = active?.school.name || "כל בתי הספר";

  const handleSwitch = async (schoolId: string | null) => {
    setOpen(false);
    try {
      // Save to localStorage for immediate use
      if (schoolId) {
        localStorage.setItem("bldr_active_school", schoolId);
      } else {
        localStorage.removeItem("bldr_active_school");
      }
      window.location.reload();
    } catch {}
  };

  if (collapsed) {
    return (
      <div ref={ref} style={{ padding: "8px", position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          title={label}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f0f0f5",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {label.charAt(0)}
        </button>
        {open && (
          <div style={{
            position: "absolute",
            left: "56px",
            top: "0",
            background: "#12121a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            padding: "4px",
            zIndex: 100,
            minWidth: "180px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}>
            <button
              onClick={() => handleSwitch(null)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                background: !activeSchoolId ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none",
                borderRadius: "4px",
                color: "#f0f0f5",
                fontSize: "13px",
                textAlign: "right",
                cursor: "pointer",
              }}
            >
              הכל
            </button>
            {schools.map((s) => (
              <button
                key={s.school.id}
                onClick={() => handleSwitch(s.school.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  background: s.school.id === activeSchoolId ? "rgba(255,255,255,0.06)" : "transparent",
                  border: "none",
                  borderRadius: "4px",
                  color: "#f0f0f5",
                  fontSize: "13px",
                  textAlign: "right",
                  cursor: "pointer",
                }}
              >
                {s.school.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ padding: "8px 12px", position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px",
          color: "#f0f0f5",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <span style={{ fontSize: "10px", opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          ▼
        </span>
      </button>
      {open && (
        <div style={{
          position: "absolute",
          left: "12px",
          right: "12px",
          top: "100%",
          background: "#12121a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          padding: "4px",
          zIndex: 100,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          <button
            onClick={() => handleSwitch(null)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: !activeSchoolId ? "rgba(255,255,255,0.06)" : "transparent",
              border: "none",
              borderRadius: "4px",
              color: "#f0f0f5",
              fontSize: "13px",
              textAlign: "right",
              cursor: "pointer",
            }}
          >
            הכל
          </button>
          {schools.map((s) => (
            <button
              key={s.school.id}
              onClick={() => handleSwitch(s.school.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                background: s.school.id === activeSchoolId ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none",
                borderRadius: "4px",
                color: "#f0f0f5",
                fontSize: "13px",
                textAlign: "right",
                cursor: "pointer",
              }}
            >
              {s.school.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
