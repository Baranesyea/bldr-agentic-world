export default function CommunityMeetingsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          fontWeight: 900,
          color: "#f0f0f5",
          marginBottom: "16px",
        }}
      >
        מפגשי קהילה
      </h1>
      <p
        style={{
          fontSize: "18px",
          color: "rgba(240,240,245,0.7)",
          textAlign: "center",
        }}
      >
        הקלטות של מפגשי הקהילה שלנו יופיעו כאן בקרוב
      </p>
    </div>
  );
}
