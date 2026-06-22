import { ImageResponse } from "next/og";

// App icon (also used as favicon + Android/maskable PWA icon).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          gap: 28,
          color: "#ffffff",
          backgroundImage: "linear-gradient(135deg, #6b5ebd 0%, #3a7dd8 100%)",
        }}
      >
        <div style={{ fontSize: 230, fontWeight: 800, letterSpacing: -8 }}>SM</div>
        {/* teleprompter "script lines" motif */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ width: 220, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.95)" }} />
          <div style={{ width: 160, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
