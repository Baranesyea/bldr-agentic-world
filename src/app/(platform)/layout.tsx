"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NextEventBanner } from "@/components/layout/next-event-banner";
import { TrialBanner } from "@/components/layout/trial-banner";
import { FeedbackWidget } from "@/components/layout/feedback-widget";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { OnboardingTour } from "@/components/layout/onboarding-tour";
import { ProfileQuestionnaire } from "@/components/layout/profile-questionnaire";
import { TouristGuard } from "@/components/ui/tourist-guard";


export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Start expanded
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tourActiveRef = useRef(false);
  const collapsedWidth = 68;
  const sidebarWidth = sidebarCollapsed ? collapsedWidth : 240;

  // Auto-collapse after 10 seconds on first load
  useEffect(() => {
    const t = setTimeout(() => {
      if (!tourActiveRef.current) setSidebarCollapsed(true);
    }, 10000);
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
    // Don't collapse if tour is active
    if (tourActiveRef.current) return;
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setSidebarCollapsed(true);
    }, 2000);
  }, [clearCollapseTimer]);

  // Lock sidebar open while tour is active
  useEffect(() => {
    const handleTourActive = (e: Event) => {
      const isActive = (e as CustomEvent).detail;
      tourActiveRef.current = isActive;
      if (isActive) {
        clearCollapseTimer();
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener("bldr:tour-active", handleTourActive);
    return () => window.removeEventListener("bldr:tour-active", handleTourActive);
  }, [clearCollapseTimer]);

  // Open sidebar when tour completes (for highlight)
  useEffect(() => {
    const handleTourComplete = () => {
      clearCollapseTimer();
      setSidebarCollapsed(false);
      // Keep it open for 5 seconds so user sees the tour button highlight
      const t = setTimeout(() => setSidebarCollapsed(true), 5000);
      collapseTimerRef.current = t;
    };
    window.addEventListener("bldr:tour-complete", handleTourComplete);
    return () => window.removeEventListener("bldr:tour-complete", handleTourComplete);
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
        <TouristGuard>{children}</TouristGuard>
      </main>
      {!isAdmin && <FeedbackWidget />}
      {!isAdmin && <WhatsAppCTA />}
      {!isAdmin && <NextEventBanner event={null} />}
      <OnboardingTour />
      <ProfileQuestionnaire />
    </div>
  );
}
