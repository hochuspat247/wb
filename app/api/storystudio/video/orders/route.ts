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
import { recordVideoPayment } from "@/lib/server/videoPayment";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";
import { createYooKassaPayment } from "@/lib/server/yookassa";
import {
  ensureEpisodes,
  getStoryProjectForUser,
  saveStoryProjectPayload,
  upsertStoryEpisode
} from "@/lib/server/storyVideo";
import { buildSignedSourceImageUrl, getSourceImageExtension } from "@/lib/server/videoSourceImage";
import { buildStorySceneVideoPrompt, buildStoryVideoSourceId } from "@/lib/storystudio/videoPrompt";
import type { CreateStoryVideoInput, StoryEpisode } from "@/types/storystudio";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  if (!isVideoEnabled()) {
    return NextResponse.json({ error: "Генерация видео отключена." }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<CreateStoryVideoInput> & {
    customerEmail?: string;
    useVideoCredit?: boolean;
  };

  if (!body.storyId || !body.characterId) {
    return NextResponse.json({ error: "Укажите storyId и characterId." }, { status: 400 });
  }

  if (!body.duration || !isGenApiVideoDuration(body.duration)) {
    return NextResponse.json({ error: "Некорректная длительность." }, { status: 400 });
  }

  const story = await getStoryProjectForUser(body.storyId, userId);
  if (!story) {
    return NextResponse.json({ error: "История не найдена." }, { status: 404 });
  }

  const character = story.characters.find((c) => c.id === body.characterId);
  if (!character) {
    return NextResponse.json({ error: "Персонаж не найден." }, { status: 404 });
  }

  if (!character.imageBase64 && !character.imageUrl) {
    return NextResponse.json(
      { error: "Сначала создайте AI-портрет персонажа — он станет основой для видео-сцены." },
      { status: 400 }
    );
  }

  const chapter = body.chapterId ? story.chapters.find((c) => c.id === body.chapterId) : undefined;
  const siteUrl = getSiteUrl(request);
  const amountRub = calculateVideoPriceRub(body.duration, body.quality || "standard", Boolean(body.generateAudio));
  const params = {
    sourceGenerationId: buildStoryVideoSourceId(body.storyId, body.characterId),
    duration: body.duration,
    aspectRatio: body.aspectRatio || "9:16",
    quality: body.quality || "standard",
    motionStyle: body.motionStyle || "premium_parallax",
    generateAudio: Boolean(body.generateAudio)
  };

  const customPrompt = buildStorySceneVideoPrompt({
    story,
    character,
    chapter,
    sceneDescription: body.sceneDescription,
    motionStyle: params.motionStyle,
    aspectRatio: params.aspectRatio
  });

  const orderId = crypto.randomUUID();
  const mimeType = character.imageMimeType || "image/png";
  const sourceImageUrl = buildSignedSourceImageUrl(siteUrl, orderId, getSourceImageExtension(mimeType));

  try {
    const order = await createVideoOrderRecord({
      userId,
      sourceGenerationId: params.sourceGenerationId,
      sourceImageUrl,
      params,
      amountRub,
      orderId,
      customPrompt
    });

    const now = new Date().toISOString();
    const episode: StoryEpisode = {
      id: crypto.randomUUID(),
      title: body.episodeTitle?.trim() || `Серия ${(story.episodes?.length ?? 0) + 1}: ${character.name}`,
      characterId: character.id,
      chapterId: body.chapterId,
      sceneDescription: body.sceneDescription?.trim() || chapter?.summary || story.hook,
      videoOrderId: order.id,
      videoUrl: null,
      status: "processing",
      createdAt: now,
      updatedAt: now
    };

    const nextStory = upsertStoryEpisode(ensureEpisodes(story), episode);
    await saveStoryProjectPayload(nextStory, userId);

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (hasUnlimitedGenerations(user)) {
      await markVideoOrderPaid(order.id);
      await startPaidKlingVideoGeneration(order.id, siteUrl);
      return NextResponse.json({ orderId: order.id, episode, story: nextStory, status: "paid", amountRub: 0, isFree: true });
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
        episode,
        story: nextStory,
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
      description: `StoryStudio: видео-серия (${body.duration} сек, ${body.quality}${body.generateAudio ? ", со звуком" : ""})`,
      idempotenceKey,
      returnUrl: `${siteUrl}/storystudio/cabinet?videoOrder=${order.id}&story=${body.storyId}`,
      userId,
      metadata: { productType: "video", videoOrderId: order.id, storyId: body.storyId }
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
      episode,
      story: nextStory,
      status: "payment_pending",
      amountRub,
      paymentUrl: confirmationUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать видео-серию.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
