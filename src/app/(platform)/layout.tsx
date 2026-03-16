"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NextEventBanner } from "@/components/layout/next-event-banner";
import { TrialBanner } from "@/components/layout/trial-banner";
import { FeedbackWidget } from "@/components/layout/feedback-widget";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { OnboardingTour } from "@/components/layout/onboarding-tour";

const mockEvent = {
  title: "Office Hours",
  date: "יום שלישי, 18 מרץ",
  time: "19:00",
  hasRsvped: false,
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Start expanded
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  // Auto-collapse after 10 seconds on first load
  useEffect(() => {
    const t = setTimeout(() => setSidebarCollapsed(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearCollapseTimer();
    setSidebarCollapsed(false);
  }, [clearCollapseTimer]);

  const handleMouseLeave = useCallback(() => {
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setSidebarCollapsed(true);
    }, 2000);
  }, [clearCollapseTimer]);

  return (
    <div style={{ minHeight: "100vh", background: "#050510" }}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: "fixed", top: 0, right: 0, width: sidebarWidth + "px", height: "100vh", zIndex: 40, transition: "width 0.3s" }}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      <main style={{ marginRight: `${sidebarWidth}px`, minHeight: "100vh", paddingBottom: "64px", transition: "margin-right 0.3s" }}>
        <TrialBanner />
        {children}
      </main>
      <FeedbackWidget />
      <WhatsAppCTA />
      {!isAdmin && <NextEventBanner event={mockEvent} />}
      <OnboardingTour />
    </div>
  );
}
