"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

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
  soundDefault: boolean;
}

const DEFAULT_STEPS: TourStep[] = [
  { id: "step-1", targetSelector: "[href='/dashboard']", title: "הלימודים", description: "כאן תמצא את כל הקורסים שלך, ממוינים בצורה נוחה כמו נטפליקס", audioUrl: "", position: "left" },
  { id: "step-2", targetSelector: "[href='/notebook']", title: "המחברת", description: "כל ההערות שלך מכל השיעורים במקום אחד", audioUrl: "", position: "left" },
  { id: "step-3", targetSelector: "[href='/calendar']", title: "לוח שנה", description: "כל האירועים והמפגשים החיים שלנו", audioUrl: "", position: "left" },
  { id: "step-4", targetSelector: "[href='/qa']", title: "שאלות ותשובות", description: "שאל שאלות, קבל תשובות מהקהילה ומהצוות", audioUrl: "", position: "left" },
  { id: "step-5", targetSelector: "[href='/profile']", title: "הפרופיל שלך", description: "עדכן את הפרטים שלך, הגדרות והעדפות", audioUrl: "", position: "left" },
];

const DEFAULT_SETTINGS: OnboardingSettings = {
  welcomeTitle: "ברוכים הבאים ל-Agentic World",
  welcomeSubtitle: "כאן אנשים שבונים לומדים איך לבנות",
  soundDefault: true,
};

function getSteps(): TourStep[] {
  try {
    const stored = localStorage.getItem("bldr_onboarding_steps");
    if (stored) return JSON.parse(stored);
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

export function OnboardingTour() {
  const [showWelcome, setShowWelcome] = useState(false);
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

  // Check for first visit or trigger
  useEffect(() => {
    const done = localStorage.getItem("bldr_onboarding_done");
    if (!done) {
      const s = getSteps();
      const st = getSettings();
      if (s.length > 0) {
        setSteps(s);
        setSettings(st);
        setSoundEnabled(st.soundDefault);
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
          setSoundEnabled(st.soundDefault);
          setCurrentStep(0);
          setShowWelcome(true);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const updateSpotlight = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
    } else {
      setSpotlightRect(null);
    }
  }, [steps]);

  // Update spotlight on step change and window resize/scroll
  useEffect(() => {
    if (!active) return;
    updateSpotlight(currentStep);

    const handleUpdate = () => updateSpotlight(currentStep);
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

    if (soundEnabled && step.audioUrl) {
      setAudioPlaying(true);
      setShowNextButton(false);
      const audio = new Audio(step.audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setAudioPlaying(false);
        setShowNextButton(true);
      };
      audio.onerror = () => {
        setAudioPlaying(false);
        setShowNextButton(true);
      };
      audio.play().catch(() => {
        setAudioPlaying(false);
        setShowNextButton(true);
      });
    } else {
      setAudioPlaying(false);
      setShowNextButton(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [active, currentStep, soundEnabled, steps]);

  const startTour = () => {
    setShowWelcome(false);
    setCurrentStep(0);
    setActive(true);
  };

  const skipTour = () => {
    setShowWelcome(false);
    setActive(false);
    localStorage.setItem("bldr_onboarding_done", "true");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((p) => p + 1);
        setTransitioning(false);
      }, 250);
    } else {
      // Tour complete
      setActive(false);
      localStorage.setItem("bldr_onboarding_done", "true");
      setShowDone(true);
      setTimeout(() => setShowDone(false), 2500);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((p) => p - 1);
        setTransitioning(false);
      }, 250);
    }
  };

  // Calculate total duration estimate (placeholder: 7s per step with audio, 3s without)
  const totalDuration = steps.reduce((acc, s) => acc + (s.audioUrl ? 7 : 3), 0);
  const durationLabel = totalDuration < 60 ? `${totalDuration} שניות` : `${Math.round(totalDuration / 60)} דקות`;

  const getTooltipPosition = (rect: DOMRect, position: string): React.CSSProperties => {
    const padding = 16;
    const tooltipWidth = 320;

    switch (position) {
      case "left":
        return {
          position: "fixed",
          top: rect.top + rect.height / 2 + "px",
          right: window.innerWidth - rect.left + padding + "px",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          position: "fixed",
          top: rect.top + rect.height / 2 + "px",
          left: rect.right + padding + "px",
          transform: "translateY(-50%)",
        };
      case "top":
        return {
          position: "fixed",
          bottom: window.innerHeight - rect.top + padding + "px",
          left: rect.left + rect.width / 2 - tooltipWidth / 2 + "px",
        };
      case "bottom":
        return {
          position: "fixed",
          top: rect.bottom + padding + "px",
          left: rect.left + rect.width / 2 - tooltipWidth / 2 + "px",
        };
      default:
        return { position: "fixed", top: rect.bottom + padding + "px", left: rect.left + "px" };
    }
  };

  if (typeof document === "undefined") return null;

  return (
    <>
      <style>{`
        @keyframes onboardFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes onboardFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes onboardSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes onboardPulse { 0%, 100% { box-shadow: 0 0 30px rgba(51,51,255,0.3); } 50% { box-shadow: 0 0 50px rgba(51,51,255,0.5); } }
        @keyframes onboardCheckmark { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100px) rotate(720deg); opacity: 0; } }
      `}</style>

      {/* Welcome screen */}
      {showWelcome && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 99990,
          background: "rgba(5,5,16,0.85)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "onboardFadeIn 0.4s ease",
          direction: "rtl",
        }}>
          <div style={{
            background: "rgba(10,10,30,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "48px 40px",
            maxWidth: "440px",
            width: "90%",
            textAlign: "center",
            animation: "onboardSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,255,0.08)",
          }}>
            {/* Tour icon */}
            <div style={{ marginBottom: "24px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(51,51,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="none" />
              </svg>
            </div>

            <h2 style={{
              fontSize: "28px", fontWeight: 700, color: "#f0f0f5",
              marginBottom: "12px", lineHeight: 1.4,
            }}>
              {settings.welcomeTitle.replace("Agentic World", "")}
              <span style={{ fontFamily: "Merriweather, serif" }}>Agentic World</span>
            </h2>

            <p style={{
              fontSize: "15px", color: "rgba(240,240,245,0.5)",
              marginBottom: "36px", lineHeight: 1.6,
            }}>
              {settings.welcomeSubtitle}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
              <button
                onClick={startTour}
                style={{
                  background: "#0000FF", color: "white",
                  border: "none", borderRadius: "12px",
                  padding: "14px 32px", fontSize: "16px", fontWeight: 700,
                  cursor: "pointer", transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#0000CC"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#0000FF"}
              >
                התחל סיור
              </button>
              <span style={{
                fontSize: "12px", color: "rgba(240,240,245,0.35)",
                background: "rgba(255,255,255,0.05)",
                padding: "6px 12px", borderRadius: "8px",
              }}>
                {durationLabel}
              </span>
            </div>

            {/* Sound toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              marginBottom: "20px",
            }}>
              <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>סיור עם סאונד</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  width: "40px", height: "22px", borderRadius: "11px", border: "none",
                  cursor: "pointer", position: "relative",
                  background: soundEnabled ? "#0000FF" : "rgba(255,255,255,0.1)",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: "16px", height: "16px", borderRadius: "50%", background: "white",
                  position: "absolute", top: "3px", transition: "right 0.2s, left 0.2s",
                  ...(soundEnabled ? { right: "3px" } : { right: "21px" }),
                }} />
              </button>
            </div>

            <button
              onClick={skipTour}
              style={{
                background: "none", border: "none",
                color: "rgba(240,240,245,0.35)", fontSize: "13px",
                cursor: "pointer", textDecoration: "underline",
              }}
            >
              דלג
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Active tour */}
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
            {/* Top section */}
            {spotlightRect && (
              <>
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, spotlightRect.top - 8) + "px", background: "rgba(5,5,16,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
                <div style={{ position: "fixed", top: Math.max(0, spotlightRect.top - 8) + "px", left: 0, width: Math.max(0, spotlightRect.left - 8) + "px", height: (spotlightRect.height + 16) + "px", background: "rgba(5,5,16,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
                <div style={{ position: "fixed", top: Math.max(0, spotlightRect.top - 8) + "px", left: (spotlightRect.right + 8) + "px", right: 0, height: (spotlightRect.height + 16) + "px", background: "rgba(5,5,16,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
                <div style={{ position: "fixed", top: (spotlightRect.bottom + 8) + "px", left: 0, right: 0, bottom: 0, background: "rgba(5,5,16,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
              </>
            )}
            {!spotlightRect && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,16,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
            )}
          </div>

          {/* Spotlight border */}
          {spotlightRect && (
            <div style={{
              position: "fixed",
              top: spotlightRect.top - 8 + "px",
              left: spotlightRect.left - 8 + "px",
              width: spotlightRect.width + 16 + "px",
              height: spotlightRect.height + 16 + "px",
              borderRadius: "12px",
              border: "2px solid rgba(51,51,255,0.5)",
              animation: "onboardPulse 2s ease-in-out infinite",
              zIndex: 99991,
              pointerEvents: "none",
              opacity: transitioning ? 0 : 1,
              transition: "opacity 0.25s, top 0.3s, left 0.3s, width 0.3s, height 0.3s",
            }} />
          )}

          {/* Tooltip */}
          {spotlightRect && steps[currentStep] && (
            <div style={{
              ...getTooltipPosition(spotlightRect, steps[currentStep].position),
              background: "rgba(10,10,30,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "320px",
              width: "320px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              zIndex: 99992,
              pointerEvents: "auto",
              opacity: transitioning ? 0 : 1,
              transition: "opacity 0.25s",
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
                {steps[currentStep].title}
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)", lineHeight: 1.6, marginBottom: "20px" }}>
                {steps[currentStep].description}
              </p>

              {/* Audio indicator */}
              {audioPlaying && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "14px" }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{
                        width: "3px", borderRadius: "2px", background: "#3333FF",
                        animation: `onboardPulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                        height: [8, 14, 6, 10][i] + "px",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>מנגן...</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(240,240,245,0.6)",
                      borderRadius: "10px",
                      padding: "10px 16px",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    הקודם
                  </button>
                )}
                {showNextButton && (
                  <button
                    onClick={nextStep}
                    style={{
                      background: "#0000FF",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      animation: "onboardFadeIn 0.3s ease",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0000CC"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0000FF"}
                  >
                    {currentStep === steps.length - 1 ? "סיום" : "הבא"}
                  </button>
                )}
                <span style={{ marginRight: "auto", fontSize: "12px", color: "rgba(240,240,245,0.35)", direction: "ltr" }}>
                  {currentStep + 1} / {steps.length}
                </span>
              </div>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "16px" }}>
                {steps.map((_, i) => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: i === currentStep ? "#3333FF" : i < currentStep ? "rgba(51,51,255,0.4)" : "rgba(255,255,255,0.15)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>

              {/* Skip link */}
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  onClick={skipTour}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(240,240,245,0.25)", fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  דלג על הסיור
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Completion celebration */}
      {showDone && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 99995,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,16,0.7)",
          animation: "onboardFadeIn 0.3s ease",
          pointerEvents: "none",
        }}>
          {/* Confetti */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: "fixed",
              top: "40%",
              left: (20 + Math.random() * 60) + "%",
              width: "8px", height: "8px",
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: ["#3333FF", "#FF3D00", "#00C853", "#FFB300", "#f0f0f5"][i % 5],
              animation: `confettiFall ${1 + Math.random() * 1.5}s ease-out ${Math.random() * 0.5}s forwards`,
              opacity: 0.8,
            }} />
          ))}
          <div style={{
            animation: "onboardCheckmark 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            textAlign: "center",
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ color: "#f0f0f5", fontSize: "20px", fontWeight: 700, marginTop: "16px" }}>
              !מעולה, סיימת את הסיור
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
