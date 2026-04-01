export default function LessonLoading() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#050510" }}>
      {/* Video area */}
      <div style={{ flex: 1, padding: "16px" }}>
        <div style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "4px",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <div style={{ height: "24px", width: "300px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginTop: "16px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      {/* Sidebar */}
      <div style={{ width: "320px", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px" }}>
        <div style={{ height: "20px", width: "120px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "16px", animation: "pulse 1.5s ease-in-out infinite" }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ height: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
