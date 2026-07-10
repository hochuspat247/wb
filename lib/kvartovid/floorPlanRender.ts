import { PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import type { KvartovidFloorPlanLayout, KvartovidFloorPlanRoom, KvartovidListingInput } from "@/types/kvartovid";

const FLOOR_PLAN_DISCLAIMER =
  "Схематическая планировка для объявления. Не является техническим планом БТИ.";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseRoomCount(rooms: string) {
  const match = rooms.match(/(\d+)/);
  const count = match ? Number.parseInt(match[1], 10) : 2;
  return Number.isFinite(count) ? Math.min(Math.max(count, 1), 6) : 2;
}

function clampRoom(room: KvartovidFloorPlanRoom, maxWidth: number, maxHeight: number): KvartovidFloorPlanRoom {
  const x = Math.max(0, Math.min(room.x, maxWidth - 40));
  const y = Math.max(0, Math.min(room.y, maxHeight - 40));
  const width = Math.max(40, Math.min(room.width, maxWidth - x));
  const height = Math.max(40, Math.min(room.height, maxHeight - y));

  return { ...room, x, y, width, height };
}

export function normalizeFloorPlanLayout(
  raw: Partial<KvartovidFloorPlanLayout> | null | undefined,
  input: KvartovidListingInput
): KvartovidFloorPlanLayout {
  const width = Math.max(600, Math.min(Number(raw?.width) || 1000, 1400));
  const height = Math.max(420, Math.min(Number(raw?.height) || 700, 1000));
  const propertyLabel = PROPERTY_TYPE_LABELS[input.propertyType];

  const rooms = Array.isArray(raw?.rooms)
    ? raw!.rooms
        .map((room) => ({
          name: String(room?.name ?? "Комната").trim() || "Комната",
          area: typeof room?.area === "number" ? room.area : undefined,
          x: Number(room?.x ?? 0),
          y: Number(room?.y ?? 0),
          width: Number(room?.width ?? 100),
          height: Number(room?.height ?? 100)
        }))
        .filter((room) => Number.isFinite(room.x) && Number.isFinite(room.y))
        .slice(0, 10)
        .map((room) => clampRoom(room, width, height))
    : [];

  if (rooms.length >= 3) {
    return {
      width,
      height,
      rooms,
      totalArea: input.area,
      propertyLabel
    };
  }

  return getFallbackFloorPlanLayout(input);
}

export function getFallbackFloorPlanLayout(input: KvartovidListingInput): KvartovidFloorPlanLayout {
  const width = 1000;
  const height = 700;
  const propertyLabel = PROPERTY_TYPE_LABELS[input.propertyType];
  const roomCount = parseRoomCount(input.rooms);

  if (input.propertyType === "studio" || roomCount <= 1) {
    return {
      width,
      height,
      totalArea: input.area,
      propertyLabel,
      rooms: [
        { name: "Студия", area: Math.round(input.area * 0.55), x: 0, y: 0, width: 620, height: 460 },
        { name: "Кухня", area: Math.round(input.area * 0.18), x: 620, y: 0, width: 380, height: 260 },
        { name: "Санузел", area: Math.round(input.area * 0.08), x: 620, y: 260, width: 200, height: 200 },
        { name: "Прихожая", area: Math.round(input.area * 0.1), x: 0, y: 460, width: 620, height: 240 },
        { name: "Лоджия", area: Math.round(input.area * 0.09), x: 820, y: 260, width: 180, height: 440 }
      ]
    };
  }

  if (roomCount === 2) {
    return {
      width,
      height,
      totalArea: input.area,
      propertyLabel,
      rooms: [
        { name: "Прихожая", area: Math.round(input.area * 0.08), x: 0, y: 0, width: 160, height: 700 },
        { name: "Кухня", area: Math.round(input.area * 0.14), x: 160, y: 0, width: 360, height: 280 },
        { name: "Гостиная", area: Math.round(input.area * 0.28), x: 520, y: 0, width: 480, height: 360 },
        { name: "Спальня", area: Math.round(input.area * 0.2), x: 160, y: 280, width: 360, height: 420 },
        { name: "Санузел", area: Math.round(input.area * 0.06), x: 520, y: 360, width: 200, height: 180 },
        { name: "Лоджия", area: Math.round(input.area * 0.08), x: 720, y: 360, width: 280, height: 340 }
      ]
    };
  }

  if (roomCount === 3) {
    return {
      width,
      height,
      totalArea: input.area,
      propertyLabel,
      rooms: [
        { name: "Прихожая", area: Math.round(input.area * 0.07), x: 0, y: 0, width: 140, height: 700 },
        { name: "Кухня", area: Math.round(input.area * 0.12), x: 140, y: 0, width: 300, height: 240 },
        { name: "Гостиная", area: Math.round(input.area * 0.22), x: 440, y: 0, width: 360, height: 320 },
        { name: "Спальня 1", area: Math.round(input.area * 0.16), x: 140, y: 240, width: 300, height: 280 },
        { name: "Спальня 2", area: Math.round(input.area * 0.14), x: 140, y: 520, width: 300, height: 180 },
        { name: "Санузел", area: Math.round(input.area * 0.05), x: 440, y: 320, width: 160, height: 140 },
        { name: "Лоджия", area: Math.round(input.area * 0.07), x: 800, y: 0, width: 200, height: 700 }
      ]
    };
  }

  return {
    width,
    height,
    totalArea: input.area,
    propertyLabel,
    rooms: [
      { name: "Прихожая", area: Math.round(input.area * 0.06), x: 0, y: 0, width: 120, height: 700 },
      { name: "Кухня", area: Math.round(input.area * 0.1), x: 120, y: 0, width: 260, height: 220 },
      { name: "Гостиная", area: Math.round(input.area * 0.2), x: 380, y: 0, width: 340, height: 300 },
      { name: "Спальня 1", area: Math.round(input.area * 0.14), x: 120, y: 220, width: 260, height: 240 },
      { name: "Спальня 2", area: Math.round(input.area * 0.12), x: 120, y: 460, width: 260, height: 240 },
      { name: "Детская", area: Math.round(input.area * 0.11), x: 380, y: 300, width: 240, height: 200 },
      { name: "Санузел", area: Math.round(input.area * 0.05), x: 620, y: 300, width: 100, height: 120 },
      { name: "Лоджия", area: Math.round(input.area * 0.06), x: 720, y: 0, width: 280, height: 700 }
    ]
  };
}

export function renderFloorPlanSvg(layout: KvartovidFloorPlanLayout): string {
  const padding = 48;
  const headerHeight = 72;
  const footerHeight = 40;
  const canvasWidth = layout.width + padding * 2;
  const canvasHeight = layout.height + padding * 2 + headerHeight + footerHeight;
  const title = `${layout.propertyLabel} · ${layout.totalArea} м²`;

  const roomShapes = layout.rooms
    .map((room) => {
      const x = padding + room.x;
      const y = padding + headerHeight + room.y;
      const label = escapeXml(room.name);
      const areaLabel = room.area ? `${room.area} м²` : "";
      const fontSize = Math.min(18, Math.max(11, Math.floor(Math.min(room.width, room.height) / 8)));

      return `
        <g>
          <rect x="${x}" y="${y}" width="${room.width}" height="${room.height}" fill="#f8faf9" stroke="#1a2e28" stroke-width="3" />
          <text x="${x + room.width / 2}" y="${y + room.height / 2 - (areaLabel ? 6 : 0)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#102019">${label}</text>
          ${
            areaLabel
              ? `<text x="${x + room.width / 2}" y="${y + room.height / 2 + fontSize}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${Math.max(10, fontSize - 2)}" fill="#4b635c">${escapeXml(areaLabel)}</text>`
              : ""
          }
        </g>
      `.trim();
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <text x="${canvasWidth / 2}" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#102019">${escapeXml(title)}</text>
  <text x="${canvasWidth / 2}" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#4b635c">Планировка сверху</text>
  <rect x="${padding - 6}" y="${padding + headerHeight - 6}" width="${layout.width + 12}" height="${layout.height + 12}" fill="none" stroke="#1a2e28" stroke-width="6" />
  ${roomShapes}
  <text x="${canvasWidth / 2}" y="${canvasHeight - 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7f78">${escapeXml(FLOOR_PLAN_DISCLAIMER)}</text>
</svg>`;
}

export { FLOOR_PLAN_DISCLAIMER };
