"use client";

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <>
      <style>{`
        .pl {
          --dur: 1.5s;
          --ring-color: rgba(51,51,255,0.3);
          --ball-color: #3333FF;
          width: 8em;
          height: 8em;
          position: relative;
        }
        .pl__outer-ring, .pl__inner-ring {
          position: absolute;
          border-radius: 50%;
        }
        .pl__outer-ring {
          inset: 0;
          border: 0.3em solid var(--ring-color);
        }
        .pl__inner-ring {
          inset: 0.8em;
          border: 0.3em solid var(--ring-color);
          opacity: 0.5;
        }
        .pl__track-cover {
          position: absolute;
          inset: -0.2em;
          border-radius: 50%;
          border: 0.5em solid transparent;
          border-top-color: #050510;
          animation: trackCover var(--dur) linear infinite;
        }
        .pl__ball {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 1.8em;
          height: 1.8em;
          margin: -0.9em 0 0 -0.9em;
          border-radius: 50%;
          background: var(--ball-color);
          animation: ball var(--dur) ease-in-out infinite;
          box-shadow: 0 0 20px rgba(51,51,255,0.4), 0 0 60px rgba(51,51,255,0.2);
        }
        .pl__ball-texture {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          background: repeating-linear-gradient(
            90deg,
            transparent 0 0.15em,
            rgba(255,255,255,0.1) 0.15em 0.3em
          );
          animation: ballTexture var(--dur) linear infinite;
        }
        .pl__ball-outer-shadow {
          position: absolute;
          inset: -0.1em;
          border-radius: 50%;
          box-shadow: inset 0 -0.5em 0.8em rgba(0,0,0,0.3);
          animation: ballOuterShadow var(--dur) linear infinite;
        }
        .pl__ball-inner-shadow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow: inset 0 0.2em 0.4em rgba(255,255,255,0.3);
          animation: ballInnerShadow var(--dur) linear infinite;
        }
        .pl__ball-side-shadows {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow: -0.3em 0 0.4em rgba(0,0,0,0.15) inset, 0.3em 0 0.4em rgba(0,0,0,0.15) inset;
        }
        @keyframes ball {
          from { transform: rotate(0) translateY(-3.2em); }
          50% { transform: rotate(180deg) translateY(-2.8em); }
          to { transform: rotate(360deg) translateY(-3.2em); }
        }
        @keyframes ballInnerShadow {
          from { transform: rotate(0); }
          to { transform: rotate(-360deg); }
        }
        @keyframes ballOuterShadow {
          from { transform: rotate(20deg); }
          to { transform: rotate(-340deg); }
        }
        @keyframes ballTexture {
          from { transform: translateX(0); }
          to { transform: translateX(50%); }
        }
        @keyframes trackCover {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(5,5,16,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 24,
      }}>
        <div className="pl">
          <div className="pl__outer-ring" />
          <div className="pl__inner-ring" />
          <div className="pl__track-cover" />
          <div className="pl__ball">
            <div className="pl__ball-texture" />
            <div className="pl__ball-outer-shadow" />
            <div className="pl__ball-inner-shadow" />
            <div className="pl__ball-side-shadows" />
          </div>
        </div>
        {text && (
          <p style={{ color: "rgba(240,240,245,0.6)", fontSize: 14 }}>{text}</p>
        )}
      </div>
    </>
  );
}
