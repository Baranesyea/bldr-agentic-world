"use client";

import React, { useState } from "react";

export default function CaseStudiesClient() {
  const [showForm, setShowForm] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!requestText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/case-study-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: requestText.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
        setRequestText("");
        setShowForm(false);
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 200px)",
      padding: "40px 20px",
      textAlign: "center",
    }}>
      <h1 style={{
        fontSize: 56,
        fontWeight: 800,
        color: "#fff",
        marginBottom: 20,
        letterSpacing: "-0.02em",
      }}>
        עולה בקרוב
      </h1>

      <p style={{
        fontSize: 18,
        color: "rgba(240,240,245,0.7)",
        maxWidth: 600,
        lineHeight: 1.7,
        marginBottom: 40,
      }}>
        מקרי בוחן הם נושאים או בקשות אישיות שעלו מתוך הקהילה והחלטנו להקדיש להן שיעור
      </p>

      {submitted && (
        <div style={{
          padding: "14px 28px",
          borderRadius: 4,
          background: "rgba(0,200,100,0.1)",
          border: "1px solid rgba(0,200,100,0.25)",
          color: "rgba(100,255,180,1)",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 24,
        }}>
          תודה! הבקשה הוגשה
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "14px 36px",
            borderRadius: 4,
            border: "none",
            background: "#0000FF",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 30px rgba(0,0,255,0.3)",
            transition: "transform 0.15s",
          }}
        >
          הגש בקשה
        </button>
      ) : (
        <div style={{
          width: "100%",
          maxWidth: 500,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          padding: 32,
        }}>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="מה תרצה שנלמד? ספר לנו..."
            style={{
              width: "100%",
              minHeight: 120,
              padding: "14px 16px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              fontSize: 15,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={handleSubmit}
              disabled={!requestText.trim() || submitting}
              style={{
                padding: "12px 28px",
                borderRadius: 4,
                border: "none",
                background: "#0000FF",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: requestText.trim() && !submitting ? "pointer" : "default",
                opacity: requestText.trim() && !submitting ? 1 : 0.4,
                fontFamily: "inherit",
              }}
            >
              {submitting ? "שולח..." : "שלח בקשה"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "12px 28px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "rgba(240,240,245,0.7)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
