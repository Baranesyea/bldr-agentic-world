"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // The recovery link can arrive in three shapes depending on Supabase's mode:
  //   1. Hash fragment: /#access_token=...&refresh_token=...&type=recovery
  //   2. Query string: ?code=... (PKCE flow)
  //   3. Already consumed into storage by the Supabase client on init
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const log = (msg: string) => {
      console.log("[reset-password]", msg);
      if (!cancelled) setDebugInfo((prev) => prev + msg + "\n");
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050510",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      direction: "rtl",
    }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          marginBottom: 8,
          textShadow: "0 0 40px rgba(0,0,255,0.3)",
        }}>
          הגדרת סיסמה
        </h1>
        <p style={{ textAlign: "center", color: "rgba(240,240,245,0.7)", marginBottom: 32, fontSize: 14 }}>
          בחר סיסמה חדשה לחשבון שלך
        </p>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          padding: "32px 28px",
        }}>
          {!ready && error ? (
            <div style={{
              background: "rgba(255,59,48,0.1)",
              border: "1px solid rgba(255,59,48,0.3)",
              borderRadius: 4,
              padding: "10px 14px",
              fontSize: 13,
              color: "#ff6b6b",
              textAlign: "center",
            }}>
              {error}
              {debugInfo && (
                <pre style={{
                  marginTop: 12, fontSize: 10, color: "rgba(240,240,245,0.5)",
                  textAlign: "left", direction: "ltr", whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 200,
                }}>{debugInfo}</pre>
              )}
            </div>
          ) : !ready ? (
            <div style={{ textAlign: "center", color: "rgba(240,240,245,0.7)", padding: "20px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#0000FF", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              מאמת קישור...
              {debugInfo && (
                <pre style={{
                  marginTop: 12, fontSize: 10, color: "rgba(240,240,245,0.4)",
                  textAlign: "left", direction: "ltr", whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 200,
                }}>{debugInfo}</pre>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && (
                <div style={{
                  background: "rgba(255,59,48,0.1)",
                  border: "1px solid rgba(255,59,48,0.3)",
                  borderRadius: 4,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#ff6b6b",
                }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  סיסמה חדשה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  style={inputStyle}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  אימות סיסמה
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  style={inputStyle}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
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
                }}
              >
                {loading ? "שומר..." : "שמור סיסמה"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
