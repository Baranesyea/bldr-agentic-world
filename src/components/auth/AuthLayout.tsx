"use client";

import { useEffect, useState, ReactNode } from "react";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { GradientDots } from "@/components/ui/gradient-dots";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";

export function AuthLayout({ children }: { children: ReactNode }) {
  // Start as true so the heavy 3D scene never mounts on phones — the
  // in-app WebView on iPhone (WhatsApp, etc.) crashes when Spline tries
  // to boot there. We flip to false on larger screens after mount.
  const [isMobile, setIsMobile] = useState(true);
  const [showDecor, setShowDecor] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setShowDecor(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes robotFadeIn {
          0% { opacity: 0; }
          30% { opacity: 0; }
          100% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .auth-hero-left { display: none !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#050510",
          display: "flex",
          flexDirection: "row-reverse",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            background: "linear-gradient(135deg, rgba(10,10,30,0.9) 0%, #050510 100%)",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              animation: "fade-up 0.6s ease-out",
            }}
          >
            {children}
          </div>
        </div>

        {showDecor && !isMobile && (
          <div
            className="auth-hero-left"
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              background: "#050510",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GradientDots
              duration={20}
              colorCycleDuration={8}
              dotSize={6}
              spacing={12}
              backgroundColor="#050510"
              style={{ zIndex: 0 }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                animation: "robotFadeIn 2s ease-out forwards",
                opacity: 0,
              }}
            >
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
            <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
              <ParticleTextEffect
                words={["Welcome to", "Agentic World", "AI Agents", "Agentic Workflows", "Agentic Marketing"]}
                style={{ position: "absolute", inset: 0, opacity: 0.6 }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background: "linear-gradient(to bottom, transparent 0%, #050510 100%)",
                }}
              />
            </div>
            <Spotlight className="z-10" size={400} />
          </div>
        )}
      </div>
    </>
  );
}
