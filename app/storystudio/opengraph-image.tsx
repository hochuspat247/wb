import { ImageResponse } from "next/og";
import { formatStoryRub, STORY_GENERATION_PRICE_RUB } from "@/lib/storystudio/pricing";
import { BRAND } from "@/lib/branding";
import { storyStudioConfig } from "@/lib/seo/storystudio";

export const runtime = "edge";
export const alt = storyStudioConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function StoryStudioOpenGraphImage() {
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
          background: "linear-gradient(135deg, #07050d 0%, #1a1030 45%, #6b4cff 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ fontSize: 26, opacity: 0.85 }}>ИИ-студия для авторов</div>
        <div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02 }}>
            Стори<span style={{ color: "#b8a6ff" }}>Студио</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 34, maxWidth: 920, lineHeight: 1.25, opacity: 0.95 }}>
            Истории · Персонажи · Карта связей · Видео-серии {BRAND.veoVersion}
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.88 }}>
          От {formatStoryRub(STORY_GENERATION_PRICE_RUB)}/ген · без подписки
        </div>
      </div>
    ),
    size
  );
}
