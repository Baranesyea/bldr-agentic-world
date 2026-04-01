export default function CourseLoading() {
  return (
    <div style={{ padding: "32px 48px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero skeleton */}
      <div style={{
        height: "300px",
        background: "linear-gradient(135deg, #0a0a2a, #000033)",
        borderRadius: "4px",
        marginBottom: "24px",
        animation: "pulse 1.5s ease-in-out infinite",
      }} />
      {/* Content skeleton */}
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ height: "24px", width: "200px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "16px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
