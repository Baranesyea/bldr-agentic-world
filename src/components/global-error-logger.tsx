"use client";

import { useEffect } from "react";

export function GlobalErrorLogger() {
  useEffect(() => {
    const IGNORE = ["AbortError", "Lock broken", "ResizeObserver", "Script error"];

    function sendError(message: string, stack?: string) {
      if (IGNORE.some((i) => message.includes(i))) return;
      try {
        const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
        fetch("/api/client-errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            stack: stack || null,
            url: window.location.href,
            userAgent: navigator.userAgent,
            userEmail: profile.email || null,
            userName: profile.full_name || null,
          }),
        }).catch(() => {});
      } catch {}
    }

    function handleError(event: ErrorEvent) {
      sendError(event.message, event.error?.stack);
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      sendError(`Unhandled Promise: ${message}`, stack);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
