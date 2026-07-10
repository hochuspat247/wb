import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, videoGenerationOrders } from "@/lib/db/schema";
import type { GeneratedVideoSnapshot, ProductCardResult } from "@/types/product-card";
import type { VideoGenerationRecord } from "@/types/video-generation";

function toIsoTimestamp(value: Date | number | string | null | undefined, fallback?: Date | number | string | null) {
  const candidate = value ?? fallback;

  if (candidate == null) {
    return new Date().toISOString();
  }

  const date = candidate instanceof Date ? candidate : new Date(candidate);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function snapshotFromOrder(
  order: Pick<
    VideoGenerationRecord,
    | "id"
    | "originalVideoUrl"
    | "provider"
    | "model"
    | "duration"
    | "quality"
    | "motionStyle"
    | "generateAudio"
    | "createdAt"
  >
): GeneratedVideoSnapshot | null {
  if (!order.originalVideoUrl) {
    return null;
  }

  return {
    orderId: order.id,
    url: order.originalVideoUrl,
    provider: order.provider,
    model: order.model,
    duration: order.duration,
    quality: order.quality,
    motionStyle: order.motionStyle,
    generateAudio: order.generateAudio,
    createdAt: order.createdAt
  };
}

export function mergeVideosIntoCardPayload(
  payload: ProductCardResult,
  snapshots: GeneratedVideoSnapshot[]
): ProductCardResult {
  const merged = new Map<string, GeneratedVideoSnapshot>();

  for (const item of payload.generatedVideos ?? []) {
    merged.set(item.orderId, item);
  }

  for (const item of snapshots) {
    merged.set(item.orderId, item);
  }

  if (payload.generatedVideoUrl && !payload.generatedVideoTaskId) {
    merged.set("legacy", {
      orderId: "legacy",
      url: payload.generatedVideoUrl,
      provider: payload.generatedVideoProvider,
      model: payload.generatedVideoModel,
      createdAt: payload.generatedAt
    });
  }

  const generatedVideos = [...merged.values()].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  if (!generatedVideos.length) {
    return payload;
  }

  const latest = generatedVideos[0];

  return {
    ...payload,
    generatedVideos,
    generatedVideoUrl: latest.url,
    generatedVideoTaskId: latest.orderId === "legacy" ? payload.generatedVideoTaskId : latest.orderId,
    generatedVideoProvider: latest.provider ?? payload.generatedVideoProvider,
    generatedVideoModel: latest.model ?? payload.generatedVideoModel,
    generatedVideoStatus: "done"
  };
}

export async function syncCompletedVideoToCard(order: VideoGenerationRecord | null) {
  if (!order || order.status !== "done" || !order.originalVideoUrl) {
    return;
  }

  const snapshot = snapshotFromOrder(order);
  if (!snapshot) {
    return;
  }

  const cardRow = await db.query.productCards.findFirst({
    where: eq(productCards.id, order.sourceGenerationId)
  });

  if (!cardRow) {
    return;
  }

  const nextPayload = mergeVideosIntoCardPayload(cardRow.payload, [snapshot]);

  await db
    .update(productCards)
    .set({ payload: nextPayload })
    .where(eq(productCards.id, order.sourceGenerationId));
}

export async function hydrateCardPayloadWithVideos(payload: ProductCardResult) {
  const rows = await db
    .select()
    .from(videoGenerationOrders)
    .where(and(eq(videoGenerationOrders.sourceGenerationId, payload.id), eq(videoGenerationOrders.status, "done")))
    .orderBy(desc(videoGenerationOrders.updatedAt));

  const snapshots = rows
    .map((row) =>
      snapshotFromOrder({
        id: row.id,
        originalVideoUrl: row.originalVideoUrl ?? undefined,
        provider: row.provider,
        model: row.model,
        duration: row.duration,
        quality: row.quality,
        motionStyle: row.motionStyle,
        generateAudio: row.generateAudio ?? false,
        createdAt: toIsoTimestamp(row.createdAt, row.updatedAt)
      })
    )
    .filter((item): item is GeneratedVideoSnapshot => item !== null);

  if (!snapshots.length) {
    return payload;
  }

  return mergeVideosIntoCardPayload(payload, snapshots);
}

export async function hydrateUserCardsWithVideos(userId: string, cards: ProductCardResult[]) {
  if (!cards.length) {
    return cards;
  }

  const cardIds = cards.map((card) => card.id);
  const rows = await db
    .select()
    .from(videoGenerationOrders)
    .where(
      and(
        eq(videoGenerationOrders.userId, userId),
        eq(videoGenerationOrders.status, "done"),
        inArray(videoGenerationOrders.sourceGenerationId, cardIds)
      )
    )
    .orderBy(desc(videoGenerationOrders.updatedAt));

  const snapshotsByCardId = new Map<string, GeneratedVideoSnapshot[]>();

  for (const row of rows) {
    const snapshot = snapshotFromOrder({
      id: row.id,
      originalVideoUrl: row.originalVideoUrl ?? undefined,
      provider: row.provider,
      model: row.model,
      duration: row.duration,
      quality: row.quality,
      motionStyle: row.motionStyle,
      generateAudio: row.generateAudio ?? false,
      createdAt: toIsoTimestamp(row.createdAt, row.updatedAt)
    });

    if (!snapshot) {
      continue;
    }

    const current = snapshotsByCardId.get(row.sourceGenerationId) ?? [];
    current.push(snapshot);
    snapshotsByCardId.set(row.sourceGenerationId, current);
  }

  return cards.map((card) => {
    const snapshots = snapshotsByCardId.get(card.id);
    return snapshots?.length ? mergeVideosIntoCardPayload(card, snapshots) : card;
  });
}
