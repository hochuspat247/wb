import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { users, videoGenerationOrders } from "@/lib/db/schema";
import { calculateVideoPriceRub } from "@/config/video-pricing";
import {
  assertCardOwnership,
  consumeVideoCredit,
  createVideoOrderRecord,
  getUserVideoCredits,
  markVideoOrderPaid,
  startPaidKlingVideoGeneration
} from "@/lib/server/videoOrders";
import { buildSignedSourceImageUrl } from "@/lib/server/videoSourceImage";
import { recordVideoPayment } from "@/lib/server/videoPayment";
import { createYooKassaPayment } from "@/lib/server/yookassa";
import type { CreateVideoOrderInput } from "@/types/video-generation";

export const runtime = "nodejs";

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

function isVideoEnabled() {
  return process.env.NEXT_PUBLIC_VIDEO_GENERATION_ENABLED !== "false";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateInput(body: Partial<CreateVideoOrderInput>) {
  if (!body.sourceGenerationId?.trim()) {
    return "sourceGenerationId is required";
  }

  if (!body.duration || !["5", "10"].includes(body.duration)) {
    return "Invalid duration";
  }

  if (!body.aspectRatio || !["1:1", "4:5", "9:16", "16:9"].includes(body.aspectRatio)) {
    return "Invalid aspectRatio";
  }

  if (!body.quality || !["standard", "pro"].includes(body.quality)) {
    return "Invalid quality";
  }

  if (
    !body.motionStyle ||
    !["soft_zoom", "premium_parallax", "light_sweep", "marketplace_motion"].includes(body.motionStyle)
  ) {
    return "Invalid motionStyle";
  }

  return null;
}

export async function POST(request: Request) {
  if (!isVideoEnabled()) {
    return NextResponse.json({ error: "Video generation is disabled" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт, чтобы создать видео." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<CreateVideoOrderInput> & {
    customerEmail?: string;
    useVideoCredit?: boolean;
  };

  const validationError = validateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await assertCardOwnership(userId, body.sourceGenerationId!);
    const siteUrl = getSiteUrl(request);
    const amountRub = calculateVideoPriceRub(body.duration!, body.quality!);
    const params = body as CreateVideoOrderInput;

    const orderId = crypto.randomUUID();
    const sourceImageUrl = buildSignedSourceImageUrl(siteUrl, orderId);

    const order = await createVideoOrderRecord({
      userId,
      sourceGenerationId: body.sourceGenerationId!,
      sourceImageUrl,
      params,
      amountRub,
      orderId
    });

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

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fallbackEmail = body.customerEmail?.trim().toLowerCase() ?? "";
    const customerEmail = isPlaceholderOAuthEmail(user.email) ? fallbackEmail : user.email;

    if (!isValidEmail(customerEmail) || isPlaceholderOAuthEmail(customerEmail)) {
      return NextResponse.json(
        {
          code: "EMAIL_REQUIRED",
          error: "Для оплаты нужен email покупателя, чтобы сформировать чек."
        },
        { status: 400 }
      );
    }

    const idempotenceKey = crypto.randomUUID();
    const payment = await createYooKassaPayment({
      amount: amountRub,
      customerEmail,
      credits: 0,
      description: `MarketCard AI: видео из карточки (${body.duration} сек, ${body.quality})`,
      idempotenceKey,
      returnUrl: `${siteUrl}/cabinet?videoOrder=${order.id}`,
      userId,
      metadata: {
        productType: "video",
        videoOrderId: order.id
      }
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      return NextResponse.json({ error: "Payment confirmation URL is missing" }, { status: 502 });
    }

    await recordVideoPayment({
      payment,
      userId,
      amountRub,
      orderId: order.id,
      idempotenceKey
    });

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
    const message = error instanceof Error ? error.message : "Не удалось создать заказ на видео.";
    const status = message === "CARD_NOT_FOUND" ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
