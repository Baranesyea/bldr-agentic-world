"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pasteWarning, setPasteWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;

  // The recovery link can arrive in three shapes depending on Supabase's mode:
  //   1. Hash fragment: /#access_token=...&refresh_token=...&type=recovery
  //   2. Query string: ?code=... (PKCE flow)
  //   3. Already consumed into storage by the Supabase client on init
  useEffect(() => {
    let cancelled = false;
    const log = (msg: string) => {
      console.log("[reset-password]", msg);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      log(`authStateChange: ${event}`);
      if (!cancelled && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        setReady(true);
      }
    });

    // Safety timeout so we never sit on the spinner forever
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError("הקישור לא אומת תוך 8 שניות. בקש לינק חדש או נסה דפדפן אחר.");
      }
    }, 8000);

    (async () => {
      try {
        log(`href: ${window.location.href}`);
        log(`hash: ${window.location.hash}`);
        log(`search: ${window.location.search}`);

        // 1) Hash tokens
        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
          const hp = new URLSearchParams(hash);
          const hashError = hp.get("error") || hp.get("error_code");
          const hashErrorDesc = hp.get("error_description");
          if (hashError) {
            log(`hash error: ${hashError} / ${hashErrorDesc}`);
            if (!cancelled) {
              clearTimeout(timeout);
              if (hashError === "otp_expired" || hashError === "access_denied") {
                setError("הקישור פג תוקף או כבר היה בשימוש. בקש קישור חדש (שכחתי סיסמה בעמוד הכניסה).");
              } else {
                setError(hashErrorDesc || hashError);
              }
            }
            return;
          }
          const accessToken = hp.get("access_token");
          const refreshToken = hp.get("refresh_token");
          if (accessToken && refreshToken) {
            log("found hash tokens → setSession");
            try { await supabase.auth.signOut({ scope: "local" }); } catch {}
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            log(`setSession result: ${error ? "ERR " + error.message : "ok"}`);
            if (!cancelled) {
              clearTimeout(timeout);
              if (error) setError(error.message || "לא ניתן לאמת את הקישור. בקש לינק חדש.");
              else setReady(true);
            }
            return;
          }
        }

        // 2) PKCE code
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          log("found ?code → exchangeCodeForSession");
          try { await supabase.auth.signOut({ scope: "local" }); } catch {}
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          log(`exchangeCodeForSession result: ${error ? "ERR " + error.message : "ok"}`);
          if (!cancelled) {
            clearTimeout(timeout);
            if (error) setError(error.message || "לא ניתן לאמת את הקישור. בקש לינק חדש.");
            else setReady(true);
          }
          return;
        }

        // 3) Session already established by Supabase client (storage)
        log("no hash/code → getSession");
        const { data } = await supabase.auth.getSession();
        log(`getSession result: ${data.session ? "has session" : "no session"}`);
        if (!cancelled) {
          clearTimeout(timeout);
          if (data.session) setReady(true);
          else setError("הקישור לא תקין או פג תוקף. בקש לינק חדש.");
        }
      } catch (err) {
        log(`EXCEPTION: ${err instanceof Error ? err.message : String(err)}`);
        if (!cancelled) {
          clearTimeout(timeout);
          setError("שגיאה באימות הקישור. בקש לינק חדש.");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    const { data: { user: currentUser }, error: getErr } = await supabase.auth.getUser();
    if (getErr || !currentUser) {
      setError("הסשן פג. בקש קישור חדש.");
      setLoading(false);
      return;
    }
    const email = currentUser.email;

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Re-authenticate with the fresh password to prove it works + get a normal
    // (non-recovery) session before heading into the app.
    if (email) {
      try {
        await supabase.auth.signOut({ scope: "local" });
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setError(signInErr.message);
          setLoading(false);
          return;
        }
      } catch {}
    }

    router.push("/dashboard");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    color: "#f0f0f5",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  const eyeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    insetInlineEnd: 12,
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "rgba(240,240,245,0.55)",
    cursor: "pointer",
    padding: 4,
    lineHeight: 0,
    display: "flex",
    alignItems: "center",
  };

  return (
    <AuthLayout>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Robot Heroes', sans-serif",
            fontSize: 42,
            fontWeight: 400,
            color: "#fff",
            margin: 0,
            textShadow: "0 0 40px rgba(0,0,255,0.3), 0 0 80px rgba(0,0,255,0.15)",
            lineHeight: 1.2,
          }}
        >
          Agentic World
        </h1>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)", marginTop: 12, lineHeight: 1.7 }}>
          מועדון לאנשים שבונים בעידן האג׳נטי
        </p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          padding: "32px 28px",
          backdropFilter: "blur(20px)",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f5", marginTop: 0, marginBottom: 8, textAlign: "center" }}>
          הגדרת סיסמה
        </h2>
        <p style={{ fontSize: 13, color: "rgba(240,240,245,0.6)", textAlign: "center", marginTop: 0, marginBottom: 24 }}>
          בחר סיסמה חדשה לחשבון שלך
        </p>

        {error && !ready && (
          <div
            style={{
              background: "rgba(255,59,48,0.1)",
              border: "1px solid rgba(255,59,48,0.3)",
              borderRadius: 4,
              padding: "10px 14px",
              fontSize: 13,
              color: "#ff6b6b",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && ready && (
            <div
              style={{
                background: "rgba(255,59,48,0.1)",
                border: "1px solid rgba(255,59,48,0.3)",
                borderRadius: 4,
                padding: "10px 14px",
                fontSize: 13,
                color: "#ff6b6b",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
              סיסמה חדשה
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                style={{ ...inputStyle, paddingInlineEnd: 44 }}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                style={eyeButtonStyle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
              אימות סיסמה
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  setPasteWarning(true);
                  setTimeout(() => setPasteWarning(false), 4000);
                }}
                onDrop={(e) => e.preventDefault()}
                autoComplete="new-password"
                placeholder="הזן שוב את הסיסמה"
                style={{
                  ...inputStyle,
                  paddingInlineEnd: 44,
                  borderColor: mismatch ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.08)",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "הסתר סיסמה" : "הצג סיסמה"}
                style={eyeButtonStyle}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mismatch && (
              <p style={{ fontSize: 12, color: "#ff6b6b", marginTop: 6 }}>הסיסמאות אינן תואמות</p>
            )}
            {pasteWarning && (
              <p style={{ fontSize: 12, color: "#fbbf24", marginTop: 6 }}>
                לא ניתן להדביק כאן — יש להקליד את הסיסמה ידנית.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || mismatch || !password || !confirm || !ready}
            style={{
              padding: "14px 16px",
              background: "#0000FF",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              boxShadow: "0 0 15px rgba(0,0,255,0.2)",
              opacity: !ready ? 0.6 : 1,
            }}
          >
            {loading ? "שומר..." : "שמור סיסמה"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
