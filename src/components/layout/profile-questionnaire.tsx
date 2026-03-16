"use client";

import { useState, useEffect } from "react";

export function ProfileQuestionnaire() {
  const [show, setShow] = useState(false);
  const [profession, setProfession] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    try {
      const done = localStorage.getItem("bldr_questionnaire_done");
      if (done) return;

      const loginCount = parseInt(localStorage.getItem("bldr_login_count") || "0");
      if (loginCount < 2) return;

      const stored = localStorage.getItem("bldr_user_profile");
      if (stored) {
        const profile = JSON.parse(stored);
        if (profile.profession || profile.learningGoal || profile.city || profile.age) return;
      }

      setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  const handleSubmit = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("bldr_user_profile") || "{}");
      const updated = {
        ...existing,
        ...(profession && { profession }),
        ...(learningGoal && { learningGoal }),
        ...(city && { city }),
        ...(age && { age: parseInt(age) }),
      };
      localStorage.setItem("bldr_user_profile", JSON.stringify(updated));
    } catch {}
    localStorage.setItem("bldr_questionnaire_done", "true");
    setShow(false);
  };

  const handleSkip = () => {
    localStorage.setItem("bldr_questionnaire_done", "true");
    setShow(false);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#f0f0f5",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
    resize: "none" as const,
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "calc(100% - 32px)",
          backdropFilter: "blur(40px) saturate(1.8)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "20px",
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), inset -1px -1px 0 rgba(255,255,255,0.1), 0 16px 64px rgba(0,0,0,0.5)",
          padding: "32px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Specular highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
          }}
        />

        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", margin: "0 0 8px", lineHeight: 1.4 }}>
          {"אנחנו רוצים להכיר אותך טיפה יותר \u{1F642}"}
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", margin: "0 0 24px", lineHeight: 1.6 }}>
          זה עוזר לנו לחדד את התכנים ולהבין מה אתם צריכים. זה ייקח בדיוק 35 שניות.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Profession */}
          <div>
            <label style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>
              מה אתם עושים בחיים המקצועיים?
            </label>
            <textarea
              rows={2}
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Learning Goal */}
          <div>
            <label style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>
              איך מה שאתם לומדים כאן עוזר או יעזור לכם?
            </label>
            <textarea
              rows={2}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>
              מאיפה אתם בארץ?
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Age */}
          <div>
            <label style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>
              בני כמה אתם?
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={inputStyle}
              min={1}
              max={120}
            />
            <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", margin: "6px 0 0", lineHeight: 1.5 }}>
              {"כמובן שלא שואלים אישה את גילה, ואצלנו יש שוויון \u{1F604} אתם לא חייבים לענות, זה רק כדי שנכיר אתכם טוב יותר"}
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            marginTop: "24px",
            padding: "12px",
            background: "#0000FF",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(0,0,255,0.2)",
          }}
        >
          !שמור ותודה
        </button>

        {/* Skip */}
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button
            onClick={handleSkip}
            style={{
              background: "none",
              border: "none",
              color: "rgba(240,240,245,0.4)",
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            אולי אחר כך
          </button>
        </div>
      </div>
    </div>
  );
}
