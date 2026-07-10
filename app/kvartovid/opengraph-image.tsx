import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/branding";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";
import { kvartovidConfig } from "@/lib/seo/kvartovid";

export const runtime = "edge";
export const alt = kvartovidConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function KvartovidOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #060d0b 0%, #0f1f1a 42%, #d97706 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ fontSize: 26, opacity: 0.9 }}>ИИ для объявлений о недвижимости</div>
        <div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02 }}>
            Кварто<span style={{ color: "#fcd34d" }}>Вид</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 32, maxWidth: 920, lineHeight: 1.25, opacity: 0.95 }}>
            Фото → текст · обложка · планировка · Авито · Циан · Домклик
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>
          От {formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект · {BRAND.kvartovid}
        </div>
      </div>
    ),
    size
  );
}
