"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { getImage } from "@/lib/image-store";

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  audioUrl: string;
  position: "top" | "bottom" | "left" | "right";
}

interface OnboardingSettings {
  welcomeTitle: string;
  welcomeSubtitle: string;
  soundEnabled?: boolean;
  soundDefault: boolean;
  welcomeAudioUrl?: string;
}

/** Resolve an idb:// audio URL to a data URL */
async function resolveAudioUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("idb://")) {
    const id = url.slice(6);
    const data = await getImage(id);
    return data || "";
  }
  return url;
}

const DEFAULT_STEPS: TourStep[] = [
  { id: "step-1", targetSelector: "[data-nav='/dashboard']", title: "הלימודים", description: "כאן תמצא את כל הקורסים שלך, ממוינים בצורה נוחה כמו נטפליקס", audioUrl: "", position: "left" },
  { id: "step-2", targetSelector: "[data-nav='/notebook']", title: "המחברת", description: "כל ההערות שלך מכל השיעורים במקום אחד", audioUrl: "", position: "left" },
  { id: "step-3", targetSelector: "[data-nav='/calendar']", title: "לוח שנה", description: "כל האירועים והמפגשים החיים שלנו", audioUrl: "", position: "left" },
  { id: "step-4", targetSelector: "[data-nav='/qa']", title: "שאלות ותשובות", description: "שאל שאלות, קבל תשובות מהקהילה ומהצוות", audioUrl: "", position: "left" },
  { id: "step-5", targetSelector: "[data-nav='/profile']", title: "הפרופיל שלך", description: "עדכן את הפרטים שלך, הגדרות והעדפות", audioUrl: "", position: "left" },
];

const DEFAULT_SETTINGS: OnboardingSettings = {
  welcomeTitle: "ברוכים הבאים ל-Agentic World",
  welcomeSubtitle: "כאן אנשים שבונים לומדים איך לבנות",
  soundDefault: true,
};

function getSteps(): TourStep[] {
  try {
    const stored = localStorage.getItem("bldr_onboarding_steps");
    if (stored) {
      const parsed: TourStep[] = JSON.parse(stored);
      // Migrate old href selectors to data-nav
      let migrated = false;
      for (const step of parsed) {
        if (step.targetSelector.startsWith("[href='")) {
          step.targetSelector = step.targetSelector.replace("[href='", "[data-nav='");
          migrated = true;
        }
      }
      if (migrated) {
        localStorage.setItem("bldr_onboarding_steps", JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {}
  localStorage.setItem("bldr_onboarding_steps", JSON.stringify(DEFAULT_STEPS));
  return DEFAULT_STEPS;
}

function getSettings(): OnboardingSettings {
  try {
    const stored = localStorage.getItem("bldr_onboarding_settings");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_SETTINGS;
}

/* ─────────────────────────────────────────────
   SiriGlowCard — the animated border wrapper
   A rotating conic-gradient spins behind the card
   creating the illusion of a living, breathing
   border — like an AI entity awakening.
   ───────────────────────────────────────────── */
function SiriGlowCard({
  children,
  borderRadius = 16,
  borderWidth = 2,
  glowIntensity = 1,
  className,
  style,
}: {
  children: React.ReactNode;
  borderRadius?: number;
  borderWidth?: number;
  glowIntensity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`siri-glow-outer ${className || ""}`}
      style={{
        position: "relative",
        borderRadius: borderRadius,
        padding: borderWidth,
        ...style,
      }}
    >
      {/* The spinning gradient layer */}
      <div
        className="siri-glow-spinner"
        style={{
          position: "absolute",
          inset: -borderWidth * 2,
          background: `conic-gradient(
            from var(--siri-angle, 0deg),
            #0000FF 0%,
            #4400FF 8%,
            #0066FF 16%,
            #00CCFF 24%,
            #0000FF 32%,
            #6600CC 40%,
            #FF3366 48%,
            #FF6600 52%,
            #FFAA00 56%,
            #00CCFF 64%,
            #0044FF 72%,
            #2200FF 80%,
            #4400FF 88%,
            #0000FF 100%
          )`,
          borderRadius: borderRadius,
          animation: "siriSpin 4s linear infinite",
          filter: `blur(${4 + glowIntensity * 8}px)`,
          opacity: 0.7 + glowIntensity * 0.3,
        }}
      />

      {/* Outer glow halo */}
      <div
        className="siri-glow-halo"
        style={{
          position: "absolute",
          inset: -borderWidth * 6,
          background: `conic-gradient(
            from var(--siri-angle-reverse, 180deg),
            rgba(0,0,255,0.12) 0%,
            rgba(0,204,255,0.08) 25%,
            rgba(102,0,204,0.10) 50%,
            rgba(255,51,102,0.06) 75%,
            rgba(0,0,255,0.12) 100%
          )`,
          borderRadius: borderRadius * 2,
          animation: "siriSpinReverse 6s linear infinite",
          filter: `blur(${20 + glowIntensity * 10}px)`,
          opacity: 0.5,
        }}
      />

      {/* The solid card surface — sits on top, masking the gradient */}
      <div
        style={{
          position: "relative",
          borderRadius: borderRadius - 1,
          background: "linear-gradient(165deg, rgba(12,12,30,0.97) 0%, rgba(8,8,22,0.99) 50%, rgba(12,12,30,0.97) 100%)",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {/* Inner ambient glow — subtle color wash from the border */}
        <div
          className="siri-inner-glow"
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, rgba(0,100,255,0.08) 0%, transparent 60%),
                          radial-gradient(ellipse at 0% 50%, rgba(102,0,204,0.05) 0%, transparent 50%),
                          radial-gradient(ellipse at 100% 50%, rgba(0,204,255,0.05) 0%, transparent 50%)`,
            animation: "siriInnerPulse 3s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Specular highlight — glass refraction at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const [fontReady, setFontReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeAudioPlayed, setWelcomeAudioPlayed] = useState(false);
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [settings, setSettings] = useState<OnboardingSettings>(DEFAULT_SETTINGS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Preload Robot Heroes font
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.load("1em 'Robot Heroes'").then(() => setFontReady(true)).catch(() => setFontReady(true));
      // Fallback timeout
      setTimeout(() => setFontReady(true), 2000);
    } else {
      setFontReady(true);
    }
  }, []);

  // Check for first visit or trigger
  useEffect(() => {
    const done = localStorage.getItem("bldr_onboarding_done") === "true";
    if (!done) {
      const s = getSteps();
      const st = getSettings();
      if (s.length > 0) {
        setSteps(s);
        setSettings(st);
        setSoundEnabled(st.soundEnabled !== false && st.soundDefault);
        setTimeout(() => setShowWelcome(true), 1000);
      }
    }

    // Listen for trigger from sidebar
    const interval = setInterval(() => {
      if (localStorage.getItem("bldr_onboarding_trigger") === "true") {
        localStorage.removeItem("bldr_onboarding_trigger");
        const s = getSteps();
        const st = getSettings();
        if (s.length > 0) {
          setSteps(s);
          setSettings(st);
          setSoundEnabled(st.soundEnabled !== false && st.soundDefault);
          setCurrentStep(0);
          setShowWelcome(true);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Play welcome audio when welcome screen shows
  const playWelcomeAudio = useCallback((audioUrl: string) => {
    if (!audioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    resolveAudioUrl(audioUrl).then((url) => {
      if (!url) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    });
  }, []);

  const updateSpotlight = useCallback((stepIndex: number, immediate = false) => {
    const step = steps[stepIndex];
    if (!step) return;

    const skipStep = () => {
      // Element not found — skip to next available step or end tour
      let nextValid = stepIndex + 1;
      while (nextValid < steps.length) {
        const nextEl = document.querySelector(steps[nextValid].targetSelector);
        if (nextEl && nextEl.getBoundingClientRect().width > 0) break;
        nextValid++;
      }
      if (nextValid < steps.length) {
        setCurrentStep(nextValid);
      } else {
        setActive(false);
        setSpotlightRect(null);
        setShowDone(true);
        localStorage.setItem("bldr_onboarding_done", "true");
        window.dispatchEvent(new CustomEvent("bldr:tour-active", { detail: false }));
        window.dispatchEvent(new CustomEvent("bldr:tour-complete"));
      }
    };

    const tryFind = (attempts = 0) => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSpotlightRect(rect);
        } else if (attempts < 5) {
          setTimeout(() => tryFind(attempts + 1), 100);
        } else {
          skipStep();
        }
      } else if (attempts < 5) {
        setTimeout(() => tryFind(attempts + 1), 100);
      } else {
        skipStep();
      }
    };
    if (immediate) {
      tryFind();
    } else {
      setTimeout(() => tryFind(), 500);
    }
  }, [steps]);

  // Update spotlight on step change and window resize/scroll
  useEffect(() => {
    if (!active) return;
    updateSpotlight(currentStep, true);

    const handleUpdate = () => updateSpotlight(currentStep, true);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [active, currentStep, updateSpotlight]);

  // Play audio when step changes
  useEffect(() => {
    if (!active) return;
    const step = steps[currentStep];
    if (!step) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let cancelled = false;

    if (soundEnabled && step.audioUrl) {
      setAudioPlaying(true);
      setShowNextButton(false);
      // Safety timeout — always show button after 3 seconds no matter what
      const safetyTimer = setTimeout(() => {
        if (!cancelled) {
          setAudioPlaying(false);
          setShowNextButton(true);
        }
      }, 3000);
      resolveAudioUrl(step.audioUrl).then((resolvedUrl) => {
        if (cancelled || !resolvedUrl) {
          clearTimeout(safetyTimer);
          setAudioPlaying(false);
          setShowNextButton(true);
          return;
        }
        const audio = new Audio(resolvedUrl);
        audioRef.current = audio;
        audio.onended = () => {
          clearTimeout(safetyTimer);
          setAudioPlaying(false);
          setShowNextButton(true);
        };
        audio.onerror = () => {
          clearTimeout(safetyTimer);
          setAudioPlaying(false);
          setShowNextButton(true);
        };
        audio.play().catch(() => {
          clearTimeout(safetyTimer);
          setAudioPlaying(false);
          setShowNextButton(true);
        });
      }).catch(() => {
        clearTimeout(safetyTimer);
        setAudioPlaying(false);
        setShowNextButton(true);
      });
    } else {
      setAudioPlaying(false);
      setShowNextButton(true);
    }

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [active, currentStep, soundEnabled, steps]);

  const [showBookmark, setShowBookmark] = useState(false);

  const startTour = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setShowWelcome(false);
    setShowBookmark(true);
  };

  const continueAfterBookmark = () => {
    setShowBookmark(false);
    setCurrentStep(0);
    setActive(true);
    window.dispatchEvent(new CustomEvent("bldr:tour-active", { detail: true }));
    setTimeout(() => updateSpotlight(0), 1000);
  };


  const skipTour = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setShowWelcome(false);
    setShowBookmark(false);
    setActive(false);
    setSpotlightRect(null);
    setShowDone(false);
    localStorage.setItem("bldr_onboarding_done", "true");
    window.dispatchEvent(new CustomEvent("bldr:tour-active", { detail: false }));
    window.dispatchEvent(new CustomEvent("bldr:tour-complete"));
    window.dispatchEvent(new CustomEvent("bldr:tour-done-dismissed"));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      // Tour complete — clear everything
      setActive(false);
      setSpotlightRect(null);
      localStorage.setItem("bldr_onboarding_done", "true");
      setShowDone(true);
      window.dispatchEvent(new CustomEvent("bldr:tour-active", { detail: false }));
      window.dispatchEvent(new CustomEvent("bldr:tour-complete"));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
    }
  };

  // Calculate total duration estimate (placeholder: 7s per step with audio, 3s without)
  const totalDuration = steps.reduce((acc, s) => acc + (s.audioUrl ? 7 : 3), 0);
  const durationLabel = totalDuration < 60 ? `${totalDuration} שניות` : `${Math.round(totalDuration / 60)} דקות`;

  const getTooltipPosition = (rect: DOMRect, position: string): React.CSSProperties => {
    const padding = 20;
    const tooltipWidth = 340;
    const tooltipEstimatedHeight = 260;
    const viewportMargin = 16;

    let top: number | undefined;
    let left: number | undefined;
    let right: number | undefined;
    let bottom: number | undefined;

    switch (position) {
      case "left":
        top = rect.top + rect.height / 2 - tooltipEstimatedHeight / 2;
        right = window.innerWidth - rect.left + padding;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipEstimatedHeight / 2;
        left = rect.right + padding;
        break;
      case "top":
        bottom = window.innerHeight - rect.top + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left;
    }

    // Clamp to viewport
    if (top !== undefined) {
      top = Math.max(viewportMargin, Math.min(top, window.innerHeight - tooltipEstimatedHeight - viewportMargin));
    }
    if (left !== undefined) {
      left = Math.max(viewportMargin, Math.min(left, window.innerWidth - tooltipWidth - viewportMargin));
    }

    const result: React.CSSProperties = { position: "fixed" };
    if (top !== undefined) result.top = top + "px";
    if (left !== undefined) result.left = left + "px";
    if (right !== undefined) result.right = right + "px";
    if (bottom !== undefined) result.bottom = bottom + "px";
    return result;
  };

  if (typeof document === "undefined") return null;

  return (
    <>
      <style>{`
        /* ── Siri Glow Animations ── */
        @property --siri-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @property --siri-angle-reverse {
          syntax: '<angle>';
          initial-value: 180deg;
          inherits: false;
        }

        @keyframes siriSpin {
          to { --siri-angle: 360deg; }
        }
        @keyframes siriSpinReverse {
          to { --siri-angle-reverse: -180deg; }
        }
        @keyframes siriInnerPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes siriAppear {
          0% { opacity: 0; transform: scale(0.92) translateY(24px); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
        @keyframes siriOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes siriBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.005); }
        }
        @keyframes siriDotPulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes onboardCheckmark {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
        @keyframes spotlightPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(0,0,255,0.3), 0 0 24px rgba(0,100,255,0.15), inset 0 0 12px rgba(0,0,255,0.1); border-color: rgba(0,0,255,0.5); }
          50% { box-shadow: 0 0 18px rgba(0,0,255,0.45), 0 0 36px rgba(0,100,255,0.25), inset 0 0 16px rgba(0,0,255,0.15); border-color: rgba(0,0,255,0.7); }
        }

        /* Fallback for browsers that don't support @property */
        @supports not (background: conic-gradient(from var(--siri-angle, 0deg), red, blue)) {
          .siri-glow-spinner {
            animation: siriSpinFallback 4s linear infinite !important;
          }
          @keyframes siriSpinFallback {
            to { transform: rotate(360deg); }
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════
          Welcome Screen — Siri Glow Edition
          ═══════════════════════════════════════ */}
      {showWelcome && fontReady && createPortal(
        <div
          onClick={() => {
            // First user interaction — unlock audio autoplay and play welcome audio
            if (!welcomeAudioPlayed && soundEnabled && settings.welcomeAudioUrl) {
              setWelcomeAudioPlayed(true);
              playWelcomeAudio(settings.welcomeAudioUrl);
            }
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 99990,
            background: "rgba(3,3,12,0.88)",
            backdropFilter: "blur(12px) saturate(1.2)", WebkitBackdropFilter: "blur(12px) saturate(1.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "siriOverlayIn 0.6s ease",
            direction: "rtl",
          }}>
          <SiriGlowCard
            borderRadius={20}
            borderWidth={2}
            glowIntensity={1}
            style={{
              maxWidth: 460,
              width: "92%",
              animation: "siriAppear 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both",
            }}
          >
            <div style={{ padding: "52px 44px 44px", textAlign: "center" }}>

              {/* Animated circles orb — AI entity */}
              <div style={{
                width: 120, height: 120, margin: "0 auto 28px",
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Background glow blurs */}
                <div style={{
                  position: "absolute", inset: -10,
                  background: "radial-gradient(ellipse at center, rgba(0,0,255,0.2) 0%, transparent 70%)",
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", inset: -10,
                  background: "radial-gradient(ellipse at center, rgba(0,204,255,0.1) 0%, transparent 60%)",
                  filter: "blur(16px)",
                  pointerEvents: "none",
                }} />
                {/* Rotating circles */}
                <motion.div style={{ position: "absolute", width: 120, height: 120 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: `2px solid ${["rgba(0,0,255,0.5)", "rgba(0,180,255,0.4)", "rgba(100,50,200,0.25)"][i]}`,
                        background: i === 0
                          ? "radial-gradient(ellipse at 40% 35%, rgba(0,0,255,0.2) 0%, rgba(0,100,255,0.08) 40%, transparent 70%)"
                          : "transparent",
                      }}
                      animate={{
                        rotate: 360,
                        scale: [1, 1.05 + i * 0.05, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 5 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: `radial-gradient(ellipse at center, ${["rgba(0,0,255,0.08)", "rgba(0,180,255,0.06)", "rgba(100,50,200,0.04)"][i]} 0%, transparent 70%)`,
                        mixBlendMode: "screen",
                      }} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 18, fontWeight: 500, color: "rgba(240,240,245,0.7)",
                  marginBottom: 6, letterSpacing: "0.01em",
                }}>
                  {settings.welcomeTitle.replace("Agentic World", "").trim()}
                </div>
                <div style={{
                  fontSize: 38, fontWeight: 800, lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  fontFamily: "'Robot Heroes', sans-serif",
                  background: "linear-gradient(135deg, #f0f0f5 0%, #8888FF 50%, #00CCFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Agentic World
                </div>
              </div>

              <p style={{
                fontSize: 15, color: "rgba(240,240,245,0.7)",
                marginBottom: 40, lineHeight: 1.7,
                maxWidth: 300, margin: "0 auto 40px",
              }}>
                {settings.welcomeSubtitle}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
                <button
                  onClick={startTour}
                  style={{
                    background: "linear-gradient(135deg, #0000FF 0%, #0033FF 100%)",
                    color: "white",
                    border: "none", borderRadius: 4,
                    padding: "11px 72px", fontSize: 16, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.25s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    boxShadow: "0 0 30px rgba(0,0,255,0.3), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.04)";
                    e.currentTarget.style.boxShadow = "0 0 40px rgba(0,0,255,0.45), 0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(0,0,255,0.3), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
                  }}
                >
                  <span>התחל סיור</span>
                  <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>{durationLabel}</span>
                </button>
              </div>

              {/* Sound toggle — only shown when admin enabled sound */}
              {settings.soundEnabled && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  marginBottom: 20,
                }}>
                  <span style={{ fontSize: 13, color: "rgba(240,240,245,0.7)" }}>סיור עם סאונד</span>
                  <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} size="sm" />
                </div>
              )}

              <button
                onClick={skipTour}
                style={{
                  background: "none", border: "none",
                  color: "rgba(240,240,245,0.7)", fontSize: 13,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f0f0f5"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.7)"}
              >
                דלג
              </button>
            </div>
          </SiriGlowCard>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════
          Bookmark Step — between welcome and tour
          ═══════════════════════════════════════ */}
      {showBookmark && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(3,3,12,0.92)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          direction: "rtl",
        }}>
          <SiriGlowCard borderRadius={16} borderWidth={2} glowIntensity={0.4} style={{ maxWidth: 400, width: "90%" }}>
            <div style={{ padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🔖</div>
              <h2 style={{
                fontSize: 22, fontWeight: 700, color: "#f0f0f5",
                marginBottom: 12, lineHeight: 1.4,
              }}>
                לפני שנתחיל
              </h2>
              <p style={{
                fontSize: 15, color: "rgba(240,240,245,0.7)",
                lineHeight: 1.7, marginBottom: 32,
              }}>
                לא לשכוח לשמור את העמוד הזה למועדפים, ככה תמיד יהיה לך קל לחזור לכאן
              </p>
              <button
                onClick={continueAfterBookmark}
                style={{
                  background: "linear-gradient(135deg, #0000FF 0%, #0033FF 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "13px 40px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(0,0,255,0.3), 0 4px 16px rgba(0,0,0,0.4)",
                  transition: "all 0.2s",
                  display: "block",
                  margin: "0 auto",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                המשך לסיור
              </button>
            </div>
          </SiriGlowCard>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════
          Active Tour — Spotlight + Glow Tooltip
          ═══════════════════════════════════════ */}
      {active && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 99990,
          direction: "rtl",
          pointerEvents: "none",
        }}>
          {/* Dark overlay with spotlight cutout */}
          <div style={{
            position: "fixed", inset: 0,
            background: "transparent",
            pointerEvents: "auto",
            zIndex: 99990,
          }}>
            <div style={{
              position: "fixed", inset: 0,
              background: "rgba(3,3,12,0.88)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              clipPath: spotlightRect
                ? `polygon(0% 0%, 0% 100%, ${spotlightRect.left - 8}px 100%, ${spotlightRect.left - 8}px ${spotlightRect.top - 8}px, ${spotlightRect.right + 8}px ${spotlightRect.top - 8}px, ${spotlightRect.right + 8}px ${spotlightRect.bottom + 8}px, ${spotlightRect.left - 8}px ${spotlightRect.bottom + 8}px, ${spotlightRect.left - 8}px 100%, 100% 100%, 100% 0%)`
                : undefined,
              transition: "clip-path 0.4s ease",
            }} />
          </div>

          {/* Spotlight border — matching the card glow colors */}
          {spotlightRect && (
            <div style={{
              position: "fixed",
              top: spotlightRect.top - 6 + "px",
              left: spotlightRect.left - 6 + "px",
              width: spotlightRect.width + 12 + "px",
              height: spotlightRect.height + 12 + "px",
              borderRadius: 4,
              zIndex: 99991,
              pointerEvents: "none",
              opacity: transitioning ? 0 : 1,
              transition: "opacity 0.25s, top 0.4s ease, left 0.4s ease, width 0.4s ease, height 0.4s ease",
              border: "2px solid rgba(0,0,255,0.5)",
              boxShadow: "0 0 12px rgba(0,0,255,0.3), 0 0 24px rgba(0,100,255,0.15), inset 0 0 12px rgba(0,0,255,0.1)",
              animation: "spotlightPulse 2s ease-in-out infinite",
            }} />
          )}

          {/* Tooltip — with Siri Glow */}
          {spotlightRect && steps[currentStep] && (
            <SiriGlowCard
              borderRadius={14}
              borderWidth={2}
              glowIntensity={0.35}
              style={{
                ...getTooltipPosition(spotlightRect, steps[currentStep].position),
                position: "fixed" as const,
                maxWidth: 340,
                width: 340,
                zIndex: 99992,
                pointerEvents: "auto",
                opacity: transitioning ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              <div style={{ padding: 24 }}>
                {/* Step number badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  marginBottom: 14,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(0,0,255,0.12)",
                  border: "1px solid rgba(0,0,255,0.2)",
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#3333FF",
                    boxShadow: "0 0 8px rgba(51,51,255,0.5)",
                    animation: "siriInnerPulse 2s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#f0f0f5", direction: "ltr" }}>
                    {currentStep + 1} / {steps.length}
                  </span>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#f0f0f5", marginBottom: 10, letterSpacing: "-0.01em" }}>
                  {steps[currentStep].title}
                </h3>
                <p style={{ fontSize: 14, color: "rgba(240,240,245,0.85)", lineHeight: 1.7, marginBottom: 22 }}>
                  {steps[currentStep].description}
                </p>

                {/* Audio indicator */}
                {audioPlaying && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <div style={{ display: "flex", gap: 2, alignItems: "center", height: 16 }}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} style={{
                          width: 3, borderRadius: 2,
                          height: 14,
                          background: "linear-gradient(to top, #0000FF, #00CCFF)",
                          animation: `siriDotPulse 1s ease-in-out ${i * 0.12}s infinite`,
                          transformOrigin: "center",
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(240,240,245,0.7)" }}>מנגן...</span>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f0f0f5",
                        borderRadius: 4,
                        padding: "10px 16px",
                        fontSize: 14,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      הקודם
                    </button>
                  )}
                  {showNextButton && (
                    <button
                      onClick={nextStep}
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #0000FF 0%, #0033FF 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "10px 22px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.25s",
                        boxShadow: "0 0 20px rgba(0,0,255,0.25), 0 2px 8px rgba(0,0,0,0.3)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(0,0,255,0.4), 0 4px 12px rgba(0,0,0,0.4)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(0,0,255,0.25), 0 2px 8px rgba(0,0,0,0.3)"; }}
                    >
                      {currentStep === steps.length - 1 ? "סיום" : "הבא"}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{
                  marginTop: 18,
                  height: 2,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: ((currentStep + 1) / steps.length * 100) + "%",
                    background: "linear-gradient(90deg, #0000FF, #00CCFF)",
                    borderRadius: 1,
                    transition: "width 0.4s ease",
                    boxShadow: "0 0 8px rgba(0,204,255,0.4)",
                  }} />
                </div>

                {/* Skip link */}
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button
                    onClick={skipTour}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(240,240,245,0.7)", fontSize: 11,
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f0f0f5"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.7)"}
                  >
                    דלג על הסיור
                  </button>
                </div>
              </div>
            </SiriGlowCard>
          )}
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════
          Completion Celebration — Glow Edition
          ═══════════════════════════════════════ */}
      {showDone && createPortal(
        <div
          onClick={() => { setShowDone(false); window.dispatchEvent(new CustomEvent("bldr:tour-done-dismissed")); }}
          style={{
          position: "fixed", inset: 0, zIndex: 99995,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(3,3,12,0.75)",
          animation: "siriOverlayIn 0.3s ease",
          cursor: "pointer",
        }}>
          {/* Confetti */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              position: "fixed",
              top: "40%",
              left: (15 + Math.random() * 70) + "%",
              width: (6 + Math.random() * 4) + "px",
              height: (6 + Math.random() * 4) + "px",
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: ["#0000FF", "#00CCFF", "#6600CC", "#FF3366", "#FFAA00", "#00C853"][i % 6],
              animation: `confettiFall ${1 + Math.random() * 1.5}s ease-out ${Math.random() * 0.5}s forwards`,
              opacity: 0.85,
            }} />
          ))}
          <div style={{
            animation: "onboardCheckmark 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          }}>
            {/* Glowing checkmark orb */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                background: "conic-gradient(from var(--siri-angle, 0deg), rgba(0,200,83,0.3), rgba(0,204,255,0.2), rgba(0,200,83,0.3))",
                animation: "siriSpin 3s linear infinite",
                filter: "blur(12px)",
              }} />
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(0,200,83,0.15) 0%, rgba(0,200,83,0.05) 100%)",
                border: "2px solid rgba(0,200,83,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 40px rgba(0,200,83,0.15), inset 0 1px 2px rgba(255,255,255,0.08)",
                position: "relative",
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <p style={{ color: "#f0f0f5", fontSize: 24, fontWeight: 700, margin: 0 }}>
              איזה כיף, סיימת את הסיור!
            </p>
            <p style={{ color: "rgba(240,240,245,0.7)", fontSize: 14, margin: 0, lineHeight: 1.7, maxWidth: 320, textAlign: "center" }}>
              דברים משתנים במערכת כל הזמן,
              <br />
              והסיור זמין לך תמיד מהתפריט.
            </p>
            <button
              onClick={() => { setShowDone(false); window.dispatchEvent(new CustomEvent("bldr:tour-done-dismissed")); }}
              style={{
                marginTop: 8,
                background: "linear-gradient(135deg, #0000FF 0%, #0033FF 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "12px 40px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0,0,255,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              כניסה למערכת
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
