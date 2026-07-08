import { and, eq, isNull } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/lib/db";
import { demoGenerations } from "@/lib/db/schema";
import { saveUserCard } from "@/lib/server/cards";
import type { ProductCardResult } from "@/types/product-card";

const PREVIEW_MIME_TYPE = "image/png";

export type DemoGenerationRecord = typeof demoGenerations.$inferSelect;

export async function createDemoGeneration(input: {
  guestId: string;
  userId?: string | null;
  clientIpHash?: string | null;
  card: ProductCardResult;
  originalImageBase64: string;
  originalImageMimeType: string;
}) {
  const originalBuffer = Buffer.from(input.originalImageBase64, "base64");
  const previewBuffer = await addDemoWatermark(originalBuffer);
  const now = new Date();

  const [row] = await db
    .insert(demoGenerations)
    .values({
      id: crypto.randomUUID(),
      guestId: input.guestId,
      userId: input.userId ?? null,
      clientIpHash: input.clientIpHash ?? null,
      status: "done",
      payload: input.card,
      originalImageBase64: input.originalImageBase64,
      originalImageMimeType: input.originalImageMimeType,
      previewImageBase64: previewBuffer.toString("base64"),
      previewImageMimeType: PREVIEW_MIME_TYPE,
      createdAt: now
    })
    .returning();

  return row;
}

export async function getDemoGeneration(id: string) {
  return db.query.demoGenerations.findFirst({
    where: eq(demoGenerations.id, id)
  });
}

export async function attachGuestGenerationsToUser(guestId: string, userId: string) {
  const rows = await db.query.demoGenerations.findMany({
    where: and(eq(demoGenerations.guestId, guestId), isNull(demoGenerations.userId))
  });

  if (!rows.length) {
    return [];
  }

  await db
    .update(demoGenerations)
    .set({ userId })
    .where(and(eq(demoGenerations.guestId, guestId), isNull(demoGenerations.userId)));

  for (const row of rows) {
    await saveUserCard(userId, {
      ...row.payload,
      id: row.payload.id || row.id,
      generatedImageBase64: row.originalImageBase64,
      generatedImageMimeType: row.originalImageMimeType,
      generatedImageDataUrl: undefined,
      generatedImageUrl: null
    });
  }

  return rows;
}

export function canReadPreview(row: DemoGenerationRecord, identity: { guestId?: string | null; userId?: string | null }) {
  if (identity.userId && row.userId === identity.userId) {
    return true;
  }

  return Boolean(identity.guestId && row.guestId === identity.guestId);
}

export function canReadOriginal(row: DemoGenerationRecord, userId?: string | null) {
  return Boolean(userId && row.userId === userId);
}

async function addDemoWatermark(originalBuffer: Buffer) {
  const image = sharp(originalBuffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 1500;
  const watermark = buildWatermarkSvg(width, height);

  return image
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .composite([{ input: Buffer.from(watermark), blend: "over" }])
    .png()
    .toBuffer();
}

function buildWatermarkSvg(width: number, height: number) {
  const stepX = Math.max(220, Math.round(width / 3));
  const stepY = Math.max(160, Math.round(height / 5));
  const fontSize = Math.max(42, Math.round(width / 12));
  const labels: string[] = [];

  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      labels.push(`<text x="${x}" y="${y}" class="demo-mark">DEMO</text>`);
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .demo-mark {
          fill: #f8fafc;
          fill-opacity: 0.13;
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 900;
          letter-spacing: 8px;
        }
      </style>
      <g transform="rotate(-32 ${width / 2} ${height / 2})">
        ${labels.join("")}
      </g>
    </svg>
  `;
}
