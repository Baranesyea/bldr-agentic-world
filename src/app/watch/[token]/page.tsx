"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { ShareLink } from "@/components/ui/share-button";

function convertToEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("player.vimeo.com")) return url;
  if (url.includes("/embed/")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0&share=0`;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
  const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function getContentTitle(link: ShareLink): string {
  if (link.type === "lesson") return link.lessonTitle || "הדרכה";
  if (link.type === "course") return link.courseTitle || "קורס";
  if (link.type === "case_study") return link.caseStudyTitle || "מקרה בוחן";
  return "תוכן";
}

function getRedirectPath(link: ShareLink): string {
  if (link.type === "lesson") return `/courses/${link.courseId}/lessons/${link.lessonId}`;
  if (link.type === "course") return `/courses/${link.courseId}`;
  if (link.type === "case_study") return `/case-studies`;
  return "/dashboard";
}

export default function WatchPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [link, setLink] = useState<ShareLink | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formChecked, setFormChecked] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Decode link data from the token itself (base64url encoded)
    let found: ShareLink | null = null;
    try {
      const padded = token.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(escape(atob(padded)));
      const payload = JSON.parse(json);
      found = {
        id: token,
        code: token,
        createdAt: "",
        uses: 0,
        status: "active",
        ...payload,
      };
    } catch {
      setInvalid(true);
      return;
    }

    if (!found) { setInvalid(true); return; }

    // Check expiry
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      setInvalid(true);
      return;
    }

    setLink(found);

    // Already registered for this token → go directly
    const touristRaw = localStorage.getItem("bldr_tourist");
    if (touristRaw) {
      const tourist = JSON.parse(touristRaw);
      if (tourist.tokenUsed === token) {
        setRedirecting(true);
        router.replace(getRedirectPath(found));
        return;
      }
    }

    // Show popup after 2 seconds
    const timer = setTimeout(() => setShowPopup(true), 2000);
    return () => clearTimeout(timer);
  }, [token, router]);

  const incrementUses = useCallback((code: string) => {
    try {
      const stored = localStorage.getItem("bldr_share_links");
      if (!stored) return;
      const links: ShareLink[] = JSON.parse(stored);
      const updated = links.map(l => l.code === code ? { ...l, uses: l.uses + 1 } : l);
      localStorage.setItem("bldr_share_links", JSON.stringify(updated));
    } catch {}
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError("נא למלא את כל השדות");
      return;
    }
    if (!formChecked) {
      setFormError("יש לאשר את תנאי השימוש ומדיניות הפרטיות");
      return;
    }
    if (!link) return;

    setSubmitting(true);

    // Save tourist data based on content type
    const touristData = {
      type: link.type,
      courseId: link.courseId,
      lessonId: link.lessonId,
      lessonTitle: link.lessonTitle || link.courseTitle || link.caseStudyTitle,
      caseStudyId: link.caseStudyId,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      tokenUsed: token,
      grantedAt: new Date().toISOString(),
    };
    localStorage.setItem("bldr_tourist", JSON.stringify(touristData));

    // Set tourist role in profile cache
    try {
      const profileRaw = localStorage.getItem("bldr_profile_cache");
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      profile.role = "tourist";
      profile.full_name = formName.trim();
      profile.email = formEmail.trim();
      profile.id = `tourist_${Date.now()}`;
      profile.created_at = new Date().toISOString();
      localStorage.setItem("bldr_profile_cache", JSON.stringify(profile));
    } catch {}

    incrementUses(token as string);

    router.push(getRedirectPath(link));
  };

  if (invalid) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0a1a", color: "#fff", flexDirection: "column", gap: "16px", padding: "24px",
      }}>
        <div style={{ fontSize: "48px" }}>🔒</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>קישור לא תקין</h1>
        <p style={{ color: "rgba(240,240,245,0.7)", textAlign: "center" }}>
          הקישור שקיבלת אינו פעיל, פג תוקפו, או שהוא לא קיים.
          <br />פנה למי ששלח לך את הקישור.
        </p>
      </div>
    );
  }

  if (redirecting || !link) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0a1a",
      }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#0000FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const videoUrl = link.videoUrl || "";
  const embedUrl = convertToEmbedUrl(videoUrl);
  const direct = isDirectVideo(videoUrl);
  const contentTitle = getContentTitle(link);
  const typeLabel = link.type === "lesson" ? "הדרכה" : link.type === "course" ? "קורס" : "מקרה בוחן";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#fff" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popupIn { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10,10,26,0.95)",
      }}>
        <Image src="/logo.png" alt="BLDR" width={100} height={36} style={{ objectFit: "contain" }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", marginBottom: "6px", letterSpacing: "0.5px" }}>
          {typeLabel}
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px", color: "#f0f0f5" }}>
          {contentTitle}
        </h1>

        {/* Show video only if there's a URL */}
        {videoUrl ? (
          <div style={{
            position: "relative", paddingBottom: "56.25%", height: 0,
            borderRadius: "8px", overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {direct ? (
              <video
                src={videoUrl}
                controls
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            ) : (
              <iframe
                src={embedUrl}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
            {showPopup && (
              <div style={{
                position: "absolute", inset: 0,
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                background: "rgba(10,10,26,0.5)",
              }} />
            )}
          </div>
        ) : (
          // No video → show teaser card with background
          <div style={{
            position: "relative", height: "320px",
            borderRadius: "8px", overflow: "hidden",
            background: "linear-gradient(135deg, #0a0a4a, #1a1aff)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>
                {link.type === "course" ? "🎓" : link.type === "case_study" ? "🔬" : "▶"}
              </div>
              <p style={{ fontSize: "16px", color: "rgba(240,240,245,0.7)" }}>
                {link.type === "course" ? "גישה מלאה לקורס" : link.type === "case_study" ? "מקרה בוחן מלא" : ""}
              </p>
            </div>
            {showPopup && (
              <div style={{
                position: "absolute", inset: 0,
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                background: "rgba(10,10,26,0.5)",
              }} />
            )}
          </div>
        )}
      </div>

      {/* Lead Capture Popup */}
      {showPopup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#0e0e22",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "40px 36px",
            width: "100%", maxWidth: "440px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,255,0.08)",
            animation: "popupIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            direction: "rtl",
          }}>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "6px" }}>
              🎬 קבלו גישה בחינם ל{typeLabel}
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "24px", lineHeight: 1.3 }}>
              {contentTitle}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "שם מלא *", value: formName, onChange: setFormName, placeholder: "ישראל ישראלי", type: "text" },
                { label: "אימייל *", value: formEmail, onChange: setFormEmail, placeholder: "israel@example.com", type: "email" },
                { label: "טלפון *", value: formPhone, onChange: setFormPhone, placeholder: "050-0000000", type: "tel" },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "6px" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)", color: "#fff",
                      fontSize: "14px", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formChecked}
                  onChange={e => setFormChecked(e.target.checked)}
                  style={{ marginTop: "2px", flexShrink: 0, width: "16px", height: "16px", accentColor: "#0000FF", cursor: "pointer" }}
                />
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>
                  אני מסכים/ה ל
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#5555ff", textDecoration: "underline" }}>
                    תנאי השימוש ומדיניות הפרטיות
                  </a>
                  {" "}ומאשר/ת קבלת עדכונים ותכנים לאימייל ולטלפון שהזנתי
                </span>
              </label>

              {formError && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "14px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, #0000FF, #3333FF)",
                  color: "#fff", fontSize: "15px", fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  marginTop: "4px",
                  boxShadow: "0 4px 20px rgba(0,0,255,0.4)",
                }}
              >
                {submitting ? "שולח..." : "קבל גישה חינם"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
