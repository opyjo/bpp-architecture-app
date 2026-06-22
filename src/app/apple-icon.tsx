import { ImageResponse } from "next/og";

// iOS "Add to Home Screen" icon (Safari uses apple-touch-icon, not the manifest).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#ffffff",
          backgroundImage: "linear-gradient(135deg, #6b5ebd 0%, #3a7dd8 100%)",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3 }}>SM</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ width: 78, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.95)" }} />
          <div style={{ width: 56, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
