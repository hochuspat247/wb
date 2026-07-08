import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, users, videoGenerationOrders } from "@/lib/db/schema";
import { createKlingVideoTask, getKlingVideoTaskStatus, normalizeKlingVideoResponse } from "@/lib/video/genapiKlingVideo";
import { buildProductCardVideoPrompt } from "@/lib/video/videoPrompt";
import { buildGenApiCallbackUrl, buildSignedSourceImageUrl, getCardSourceImageData } from "@/lib/server/videoSourceImage";
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
    prompt: row.prompt,
    amountRub: row.amountRub ?? undefined,
    paymentId: row.paymentId ?? undefined,
    externalTaskId: row.externalTaskId ?? undefined,
    originalVideoUrl: row.originalVideoUrl ?? undefined,
    error: row.error ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : undefined
  };
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
    .orderBy(desc(videoGenerationOrders.createdAt));

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
}) {
  const prompt = buildProductCardVideoPrompt({ motionStyle: input.params.motionStyle });
  const now = new Date();
  const orderId = input.orderId || crypto.randomUUID();

  await db.insert(videoGenerationOrders).values({
    id: orderId,
    userId: input.userId,
    sourceGenerationId: input.sourceGenerationId,
    sourceImageUrl: input.sourceImageUrl,
    provider: "genapi",
    model: "kling-video-o3",
    status: input.status || "payment_pending",
    duration: input.params.duration,
    aspectRatio: input.params.aspectRatio,
    quality: input.params.quality,
    motionStyle: input.params.motionStyle,
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

export async function startPaidKlingVideoGeneration(orderId: string, siteUrl: string) {
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
  const sourceImage = card ? getCardSourceImageData(card.payload) : null;
  const maxInlineImageBytes = 4 * 1024 * 1024;
  const inlineImage =
    sourceImage && Buffer.byteLength(sourceImage.base64, "base64") <= maxInlineImageBytes
      ? sourceImage
      : null;

  const callbackUrl = buildGenApiCallbackUrl(siteUrl);
  const task = await createKlingVideoTask({
    prompt: order.prompt,
    startImageBase64: inlineImage?.base64,
    startImageMimeType: inlineImage?.mimeType,
    startImageUrl: inlineImage ? undefined : buildSignedSourceImageUrl(siteUrl, order.id),
    duration: order.duration,
    aspectRatio: order.aspectRatio,
    quality: order.quality,
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

export async function refreshVideoOrderStatus(orderId: string) {
  const order = await getVideoOrderById(orderId);

  if (!order?.externalTaskId) {
    return order;
  }

  if (order.status === "done" || order.status === "error" || order.status === "cancelled") {
    return order;
  }

  const remote = await getKlingVideoTaskStatus(order.externalTaskId);
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

  return getVideoOrderById(orderId);
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
    ? normalizeKlingVideoResponse({
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
    : await getKlingVideoTaskStatus(externalTaskId);
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

  return getVideoOrderById(row.id);
}

export async function cancelVideoOrder(orderId: string) {
  const now = new Date();
  await db
    .update(videoGenerationOrders)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(videoGenerationOrders.id, orderId));

  return getVideoOrderById(orderId);
}
