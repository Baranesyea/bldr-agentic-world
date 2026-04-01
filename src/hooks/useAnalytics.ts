"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("bldr_analytics_session");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("bldr_analytics_session", sid);
  }
  return sid;
}

function getDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

async function getUserEmail(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email || null;
  } catch {
    return null;
  }
}

let cachedEmail: string | null = null;
let emailFetched = false;

export function useAnalytics() {
  const sessionId = useRef("");
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const sendEvent = useCallback(async (eventType: string, eventData: Record<string, unknown> = {}) => {
    if (!emailFetched) {
      cachedEmail = await getUserEmail();
      emailFetched = true;
    }

    const payload = {
      eventType,
      eventData,
      sessionId: sessionId.current,
      pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      userEmail: cachedEmail,
    };

    try {
      if (eventType === "session_heartbeat" && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", JSON.stringify(payload));
      } else {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const trackEvent = useCallback((type: string, data: Record<string, unknown> = {}) => {
    sendEvent(type, data);
  }, [sendEvent]);

  const trackPageView = useCallback((path?: string, title?: string) => {
    sendEvent("page_view", {
      path: path || (typeof window !== "undefined" ? window.location.pathname : ""),
      title: title || (typeof document !== "undefined" ? document.title : ""),
    });
  }, [sendEvent]);

  const trackVideoProgress = useCallback((lessonId: string, courseId: string, seconds: number, totalDuration: number) => {
    sendEvent("video_progress", { lessonId, courseId, seconds, totalDuration });
  }, [sendEvent]);

  // Session start + heartbeat
  useEffect(() => {
    sessionId.current = getSessionId();
    startTimeRef.current = Date.now();

    sendEvent("session_start", { deviceType: getDeviceType() });

    heartbeatRef.current = setInterval(() => {
      const activeDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      sendEvent("session_heartbeat", { activeDuration });
    }, 60000);

    // Send heartbeat on page close
    const handleBeforeUnload = () => {
      const activeDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        eventType: "session_heartbeat",
        eventData: { activeDuration },
        sessionId: sessionId.current,
        pageUrl: window.location.pathname,
        userEmail: cachedEmail,
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", JSON.stringify(payload));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sendEvent]);

  return { trackEvent, trackPageView, trackVideoProgress };
}
