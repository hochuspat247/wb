import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { users, videoGenerationOrders } from "@/lib/db/schema";
import { calculateVideoPriceRub, isGenApiVideoDuration } from "@/config/video-pricing";
import {
  consumeVideoCredit,
  createVideoOrderRecord,
  getUserVideoCredits,
  markVideoOrderPaid,
  startPaidKlingVideoGeneration
} from "@/lib/server/videoOrders";
import { buildKvartovidVideoSourceId, saveKvartovidVideoSource } from "@/lib/server/kvartovidVideo";
import { recordVideoPayment } from "@/lib/server/videoPayment";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";
import { createYooKassaPayment } from "@/lib/server/yookassa";
import { buildSignedSourceImageUrl, getSourceImageExtension } from "@/lib/server/videoSourceImage";
import { buildKvartovidVeoVideoPrompt } from "@/lib/kvartovid/videoPrompt";
import { BRAND } from "@/lib/branding";
import type { CreateKvartovidVideoInput } from "@/types/kvartovid";

export const runtime = "nodejs";

const MAX_VIDEO_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function isVideoEnabled() {
  return process.env.NEXT_PUBLIC_VIDEO_GENERATION_ENABLED !== "false";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateInput(body: Partial<CreateKvartovidVideoInput>) {
  if (!body.title?.trim() || !body.description?.trim()) {
    return "Нужны заголовок и описание объявления.";
  }

  if (!body.duration || !isGenApiVideoDuration(body.duration)) {
    return "Некорректная длительность.";
  }

  if (!body.aspectRatio || !["1:1", "4:5", "9:16", "16:9"].includes(body.aspectRatio)) {
    return "Некорректный формат видео.";
  }

  if (!body.imageBase64 || !body.imageMimeType) {
    return "Для видео нужна обложка или исходное фото квартиры.";
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(body.imageMimeType)) {
    return "Для видео поддерживаются только JPEG, PNG и WebP.";
  }

  const size = Buffer.byteLength(body.imageBase64, "base64");
  if (size > MAX_VIDEO_SOURCE_IMAGE_BYTES) {
    return "Изображение для видео слишком большое. Загрузите файл до 8 МБ.";
  }

  return null;
}

export async function POST(request: Request) {
  if (!isVideoEnabled()) {
    return NextResponse.json({ error: "Генерация видео отключена." }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<CreateKvartovidVideoInput> & {
    customerEmail?: string;
    useVideoCredit?: boolean;
  };

  const validationError = validateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const siteUrl = getSiteUrl(request);
  const orderId = crypto.randomUUID();
  const motionStyle = body.motionStyle || "premium_parallax";
  const quality = body.quality || "standard";
  const aspectRatio = body.aspectRatio || "9:16";
  const duration = body.duration || "8";

  const customPrompt = buildKvartovidVeoVideoPrompt({
    title: body.title!.trim(),
    description: body.description!.trim(),
    advantages: body.advantages,
    city: body.city,
    rooms: body.rooms,
    area: body.area,
    propertyType: body.propertyType,
    renovation: body.renovation,
    extraFeatures: body.extraFeatures,
    motionStyle,
    aspectRatio
  });

  const params = {
    sourceGenerationId: buildKvartovidVideoSourceId(orderId),
    duration,
    aspectRatio,
    quality,
    motionStyle,
    generateAudio: Boolean(body.generateAudio)
  };

  const mimeType = body.imageMimeType || "image/png";
  const sourceImageUrl = buildSignedSourceImageUrl(siteUrl, orderId, getSourceImageExtension(mimeType));
  const amountRub = calculateVideoPriceRub(duration, quality, Boolean(body.generateAudio));

  try {
    await saveKvartovidVideoSource({
      orderId,
      userId,
      imageBase64: body.imageBase64!,
      imageMimeType: mimeType
    });

    const order = await createVideoOrderRecord({
      userId,
      sourceGenerationId: params.sourceGenerationId,
      sourceImageUrl,
      params,
      amountRub,
      orderId,
      customPrompt
    });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (hasUnlimitedGenerations(user)) {
      await markVideoOrderPaid(order.id);
      await startPaidKlingVideoGeneration(order.id, siteUrl);
      return NextResponse.json({ orderId: order.id, status: "paid", amountRub: 0, isFree: true });
    }

    const videoCredits = await getUserVideoCredits(userId);
    if (body.useVideoCredit && videoCredits > 0) {
      const remaining = await consumeVideoCredit(userId);
      if (remaining === null) {
        return NextResponse.json({ error: "Недостаточно video-credits" }, { status: 402 });
      }

      await markVideoOrderPaid(order.id);
      await startPaidKlingVideoGeneration(order.id, siteUrl);
      return NextResponse.json({
        orderId: order.id,
        status: "paid",
        amountRub: 0,
        usedVideoCredit: true
      });
    }

    const fallbackEmail = body.customerEmail?.trim().toLowerCase() ?? "";
    const customerEmail = isPlaceholderOAuthEmail(user.email) ? fallbackEmail : user.email;

    if (!isValidEmail(customerEmail) || isPlaceholderOAuthEmail(customerEmail)) {
      return NextResponse.json(
        { code: "EMAIL_REQUIRED", error: "Для оплаты нужен email покупателя, чтобы сформировать чек." },
        { status: 400 }
      );
    }

    const idempotenceKey = crypto.randomUUID();
    const payment = await createYooKassaPayment({
      amount: amountRub,
      customerEmail,
      credits: 0,
      description: `${BRAND.kvartovid}: видео из объявления (${duration} сек, ${quality}${body.generateAudio ? ", со звуком" : ""})`,
      idempotenceKey,
      returnUrl: `${siteUrl}/kvartovid/create?videoOrder=${order.id}`,
      userId,
      metadata: { productType: "video", videoOrderId: order.id, source: "kvartovid" }
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      return NextResponse.json({ error: "Payment confirmation URL is missing" }, { status: 502 });
    }

    await recordVideoPayment({ payment, userId, amountRub, orderId: order.id, idempotenceKey });

    await db
      .update(videoGenerationOrders)
      .set({ paymentId: payment.id, updatedAt: new Date() })
      .where(eq(videoGenerationOrders.id, order.id));

    return NextResponse.json({
      orderId: order.id,
      status: "payment_pending",
      amountRub,
      paymentUrl: confirmationUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать видео.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
