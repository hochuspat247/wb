import { ImageResponse } from "next/og";
import { SKU_KIT_PRICE_RUB, formatRub } from "@/lib/pricing";
import { siteConfig } from "@/lib/seo";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #6D28D9 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.8 }}>ИИ для продавцов Wildberries, Ozon и Авито</div>
        <div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{siteConfig.name}</div>
          <div style={{ marginTop: 24, fontSize: 34, maxWidth: 900, lineHeight: 1.3 }}>
            Карточки и SEO для маркетплейсов за 1–2 минуты
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.85 }}>
          1 пробная карточка · комплект от {formatRub(SKU_KIT_PRICE_RUB)} · WB API
        </div>
      </div>
    ),
    size
  );
}
