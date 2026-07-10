import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, users, videoGenerationOrders } from "@/lib/db/schema";
import { createVeoVideoTask, getVeoVideoTaskStatus, normalizeVeoVideoResponse } from "@/lib/video/genapiVeoVideo";
import { buildProductCardVideoPrompt } from "@/lib/video/videoPrompt";
import { buildGenApiCallbackUrl, buildSignedSourceImageUrl, getCardSourceImageData, getSourceImageExtension } from "@/lib/server/videoSourceImage";
import { syncCompletedVideoToStory, getStoryCharacterSourceImage } from "@/lib/server/storyVideo";
import { getKvartovidVideoSource, parseKvartovidVideoSourceId } from "@/lib/server/kvartovidVideo";
import { parseStoryVideoSourceId } from "@/lib/storystudio/videoPrompt";
import { syncCompletedVideoToCard } from "@/lib/server/cardVideos";
import type { ProductCardResult } from "@/types/product-card";
import type { CreateVideoOrderInput, VideoGenerationRecord } from "@/types/video-generation";

function mapOrder(row: typeof videoGenerationOrders.$inferSelect): VideoGenerationRecord {
  return {
    id: row.id,
    userId: row.userId,
    sourceGenerationId: row.sourceGenerationId,
    sourceImageUrl: row.sourceImageUrl,
    provider: row.provider,
    model: row.model,
    status: row.status,
    duration: row.duration,
    aspectRatio: row.aspectRatio,
    quality: row.quality,
    motionStyle: row.motionStyle,
    generateAudio: row.generateAudio ?? false,
    prompt: row.prompt,
    amountRub: row.amountRub ?? undefined,
    paymentId: row.paymentId ?? undefined,
    externalTaskId: row.externalTaskId ?? undefined,
    originalVideoUrl: row.originalVideoUrl ?? undefined,
    error: row.error ?? undefined,
    createdAt: toIsoTimestamp(row.createdAt, row.updatedAt),
    updatedAt: new Date(row.updatedAt).toISOString(),
    paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : undefined
  };
}

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

export async function getVideoOrderById(orderId: string) {
  const row = await db.query.videoGenerationOrders.findFirst({
    where: eq(videoGenerationOrders.id, orderId)
  });

  return row ? mapOrder(row) : null;
}

export async function getUserVideoOrders(userId: string) {
  const rows = await db
    .select()
    .from(videoGenerationOrders)
    .where(eq(videoGenerationOrders.userId, userId))
    .orderBy(desc(videoGenerationOrders.updatedAt));

  return rows.map(mapOrder);
}

export async function getOwnedVideoOrder(orderId: string, userId: string) {
  const row = await db.query.videoGenerationOrders.findFirst({
    where: and(eq(videoGenerationOrders.id, orderId), eq(videoGenerationOrders.userId, userId))
  });

  return row ? mapOrder(row) : null;
}

export async function assertCardOwnership(userId: string, sourceGenerationId: string) {
  const card = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, sourceGenerationId), eq(productCards.userId, userId))
  });

  if (!card) {
    throw new Error("CARD_NOT_FOUND");
  }

  return card.payload;
}

export async function createVideoOrderRecord(input: {
  userId: string;
  sourceGenerationId: string;
  sourceImageUrl: string;
  params: CreateVideoOrderInput;
  amountRub: number;
  paymentId?: string;
  status?: VideoGenerationRecord["status"];
  orderId?: string;
  cardPayload?: ProductCardResult;
  customPrompt?: string;
}) {
  const prompt =
    input.customPrompt ||
    buildProductCardVideoPrompt({
      motionStyle: input.params.motionStyle,
      aspectRatio: input.params.aspectRatio,
      card: input.cardPayload
    });
  const now = new Date();
  const orderId = input.orderId || crypto.randomUUID();

  await db.insert(videoGenerationOrders).values({
    id: orderId,
    userId: input.userId,
    sourceGenerationId: input.sourceGenerationId,
    sourceImageUrl: input.sourceImageUrl,
    provider: "genapi",
    model: "veo-3-1-fast",
    status: input.status || "payment_pending",
    duration: input.params.duration,
    aspectRatio: input.params.aspectRatio,
    quality: input.params.quality,
    motionStyle: input.params.motionStyle,
    generateAudio: Boolean(input.params.generateAudio),
    prompt,
    amountRub: input.amountRub,
    paymentId: input.paymentId,
    createdAt: now,
    updatedAt: now
  });

  const created = await getVideoOrderById(orderId);

  if (!created) {
    throw new Error("VIDEO_ORDER_CREATE_FAILED");
  }

  return created;
}

export async function markVideoOrderPaid(orderId: string, paymentId?: string) {
  const now = new Date();

  await db
    .update(videoGenerationOrders)
    .set({
      status: "paid",
      paidAt: now,
      paymentId: paymentId || undefined,
      updatedAt: now
    })
    .where(eq(videoGenerationOrders.id, orderId));

  return getVideoOrderById(orderId);
}

export async function consumeVideoCredit(userId: string) {
  const updated = await db
    .update(users)
    .set({
      videoCredits: sql`${users.videoCredits} - 1`
    })
    .where(and(eq(users.id, userId), sql`${users.videoCredits} > 0`))
    .returning({ videoCredits: users.videoCredits });

  return updated[0]?.videoCredits ?? null;
}

export async function getUserVideoCredits(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  return user?.videoCredits ?? 0;
}

export async function startPaidVideoGeneration(orderId: string, siteUrl: string) {
  const order = await getVideoOrderById(orderId);

  if (!order) {
    throw new Error("VIDEO_ORDER_NOT_FOUND");
  }

  if (order.status !== "paid") {
    throw new Error("Video generation can be started only after successful payment.");
  }

  if (!order.paidAt) {
    throw new Error("Video generation can be started only after successful payment.");
  }

  if (order.externalTaskId) {
    return order;
  }

  const card = await db.query.productCards.findFirst({
    where: eq(productCards.id, order.sourceGenerationId)
  });
  const storyRef = parseStoryVideoSourceId(order.sourceGenerationId);
  let sourceImage = card ? getCardSourceImageData(card.payload) : null;

  if (!sourceImage && storyRef) {
    sourceImage = (await getStoryCharacterSourceImage(storyRef.storyId, storyRef.characterId)) ?? null;
  }

  const kvartovidOrderId = parseKvartovidVideoSourceId(order.sourceGenerationId);
  if (!sourceImage && kvartovidOrderId) {
    sourceImage = (await getKvartovidVideoSource(kvartovidOrderId)) ?? null;
  }
  const sourceImageUrl = buildSignedSourceImageUrl(
    siteUrl,
    order.id,
    getSourceImageExtension(sourceImage?.mimeType || "image/png")
  );

  const callbackUrl = buildGenApiCallbackUrl(siteUrl);
  const task = await createVeoVideoTask({
    prompt: order.prompt,
    startImageUrl: sourceImageUrl,
    duration: order.duration,
    aspectRatio: order.aspectRatio,
    quality: order.quality,
    generateAudio: order.generateAudio,
    callbackUrl
  });

  const now = new Date();
  await db
    .update(videoGenerationOrders)
    .set({
      externalTaskId: task.externalTaskId,
      status: "queued",
      updatedAt: now
    })
    .where(eq(videoGenerationOrders.id, orderId));

  return getVideoOrderById(orderId);
}

/** @deprecated Используйте startPaidVideoGeneration. */
export const startPaidKlingVideoGeneration = startPaidVideoGeneration;

export async function refreshVideoOrderStatus(orderId: string) {
  const order = await getVideoOrderById(orderId);

  if (!order?.externalTaskId) {
    return order;
  }

  if (order.status === "done" || order.status === "error" || order.status === "cancelled") {
    return order;
  }

  const remote = await getVeoVideoTaskStatus(order.externalTaskId);
  const now = new Date();
  const nextStatus =
    remote.status === "done"
      ? "done"
      : remote.status === "error"
        ? "error"
        : remote.status === "processing"
          ? "processing"
          : "queued";

  await db
    .update(videoGenerationOrders)
    .set({
      status: nextStatus,
      originalVideoUrl: remote.videoUrl || order.originalVideoUrl || null,
      error: remote.error || order.error || null,
      updatedAt: now
    })
    .where(eq(videoGenerationOrders.id, orderId));

  const updated = await getVideoOrderById(orderId);
  await syncCompletedVideoToCard(updated);
  await syncCompletedVideoToStory(updated);

  return updated;
}

export async function applyGenApiCallback(
  externalTaskId: string,
  callbackPayload?: Record<string, unknown>
) {
  const row = await db.query.videoGenerationOrders.findFirst({
    where: eq(videoGenerationOrders.externalTaskId, externalTaskId)
  });

  if (!row) {
    return null;
  }

  const remote = callbackPayload
    ? normalizeVeoVideoResponse({
        request_id:
          typeof callbackPayload.request_id === "string" || typeof callbackPayload.request_id === "number"
            ? callbackPayload.request_id
            : externalTaskId,
        status: typeof callbackPayload.status === "string" ? callbackPayload.status : undefined,
        output: callbackPayload.output,
        result: callbackPayload.result,
        message: typeof callbackPayload.message === "string" ? callbackPayload.message : undefined,
        error: typeof callbackPayload.error === "string" ? callbackPayload.error : undefined
      })
    : await getVeoVideoTaskStatus(externalTaskId);
  const now = new Date();

  await db
    .update(videoGenerationOrders)
    .set({
      status: remote.status === "done" ? "done" : remote.status === "error" ? "error" : "processing",
      originalVideoUrl: remote.videoUrl || row.originalVideoUrl,
      error: remote.error || row.error,
      updatedAt: now
    })
    .where(eq(videoGenerationOrders.id, row.id));

  const updated = await getVideoOrderById(row.id);
  await syncCompletedVideoToCard(updated);
  await syncCompletedVideoToStory(updated);

  return updated;
}

export async function cancelVideoOrder(orderId: string) {
  const now = new Date();
  await db
    .update(videoGenerationOrders)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(videoGenerationOrders.id, orderId));

  return getVideoOrderById(orderId);
}
