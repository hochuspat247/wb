import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kvartovidVideoSources } from "@/lib/db/schema";

const PREFIX = "kvartovid:";

export function buildKvartovidVideoSourceId(orderId: string) {
  return `${PREFIX}${orderId}`;
}

export function parseKvartovidVideoSourceId(sourceGenerationId: string) {
  if (!sourceGenerationId.startsWith(PREFIX)) {
    return null;
  }

  const orderId = sourceGenerationId.slice(PREFIX.length).trim();
  return orderId || null;
}

export async function saveKvartovidVideoSource(input: {
  orderId: string;
  userId: string;
  imageBase64: string;
  imageMimeType: string;
}) {
  const now = new Date();

  await db
    .insert(kvartovidVideoSources)
    .values({
      orderId: input.orderId,
      userId: input.userId,
      imageBase64: input.imageBase64,
      imageMimeType: input.imageMimeType,
      createdAt: now
    })
    .onConflictDoUpdate({
      target: kvartovidVideoSources.orderId,
      set: {
        imageBase64: input.imageBase64,
        imageMimeType: input.imageMimeType,
        createdAt: now
      }
    });
}

export async function getKvartovidVideoSource(orderId: string, userId?: string) {
  const row = await db.query.kvartovidVideoSources.findFirst({
    where: eq(kvartovidVideoSources.orderId, orderId)
  });

  if (!row) {
    return null;
  }

  if (userId && row.userId !== userId) {
    return null;
  }

  return {
    base64: row.imageBase64,
    mimeType: row.imageMimeType
  };
}
