import { ImageResponse } from "next/og";
import { BRAND_ACCENT } from "@/lib/brand-colors";

export const runtime = "edge";
export const alt = "LoueTonMatos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "#1a1d23",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>LoueTonMatos</div>
        <div style={{ fontSize: 28, marginTop: 16, color: BRAND_ACCENT }}>
          Louez entre créatifs, en confiance
        </div>
      </div>
    ),
    { ...size }
  );
}
