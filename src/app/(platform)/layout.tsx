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
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccessCheck } from "@/hooks/useAccessCheck";
import { CountdownTimer } from "@/components/layout/countdown-timer";
import { PricingPopup } from "@/components/ui/pricing-popup";
import { EntryVideo } from "@/components/layout/entry-video";
import { ReviewPopup } from "@/components/layout/review-popup";


export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { trackPageView } = useAnalytics();

  // Track page views on route change
  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname, trackPageView]);
  const isAdmin = pathname?.startsWith("/admin");
  const access = useAccessCheck();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Start expanded
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tourActiveRef = useRef(false);
  const collapsedWidth = 68;
  const sidebarWidth = sidebarCollapsed ? collapsedWidth : 240;

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auto-collapse after 10 seconds on first load (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const t = setTimeout(() => {
      if (!tourActiveRef.current) setSidebarCollapsed(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [isMobile]);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    clearCollapseTimer();
    setSidebarCollapsed(false);
  }, [clearCollapseTimer, isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    // Don't collapse if tour is active
    if (tourActiveRef.current) return;
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setSidebarCollapsed(true);
    }, 2000);
  }, [clearCollapseTimer, isMobile]);

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
      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 56, zIndex: 50,
          background: "rgba(10,10,26,0.95)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", direction: "rtl",
        }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none", border: "none", color: "#f0f0f5",
              cursor: "pointer", padding: 8, display: "flex", alignItems: "center",
            }}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <img src="/logo.png" alt="BLDR" style={{ height: 38, objectFit: "contain" }} />
          <div style={{ width: 40 }} /> {/* spacer for centering logo */}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 280,
              zIndex: 61, animation: "mobileSlideIn 0.25s ease-out",
            }}
          >
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ position: "fixed", top: 0, right: 0, width: sidebarWidth + "px", height: "100vh", zIndex: 40, transition: "width 0.3s" }}
        >
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
      )}

      <main style={{
        marginRight: isMobile ? 0 : `${sidebarWidth}px`,
        paddingTop: isMobile ? 56 : 0,
        minHeight: "100vh",
        paddingBottom: "64px",
        transition: "margin-right 0.3s",
      }}>
        {/* Countdown timer for time-limited access */}
        {!access.loading && access.expiresAt && !access.expired && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 16px" }}>
            <CountdownTimer expiresAt={access.expiresAt} />
          </div>
        )}
        <TrialBanner />
        <TouristGuard>{children}</TouristGuard>
      </main>
      {/* Full lock popup - non-dismissible when access fully expired */}
      {!access.loading && access.expired && access.expiryMode === "full_lock" && (
        <PricingPopup onClose={() => {}} dismissible={false} />
      )}
      {!isAdmin && <FeedbackWidget />}
      {!isAdmin && <WhatsAppCTA />}
      {!isAdmin && <NextEventBanner event={null} />}
      {!isMobile && <OnboardingTour />}
      <EntryVideo />
      <ReviewPopup />
      <ProfileQuestionnaire />

      <style>{`
        @keyframes mobileSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
