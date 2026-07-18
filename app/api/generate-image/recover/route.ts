import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { IMAGE_GENERATION_RETRY_MESSAGE } from "@/lib/ai/imageGenerationErrors";
import { recoverNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import {
  consumeImageGenerationTicket,
  hasValidImageGenerationTicket
} from "@/lib/server/imageGenerationTickets";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

type RecoverBody = {
  generationId?: string;
  imageGenerationTicket?: string;
};

/**
 * Pull an already-finished provider job without starting a new generation.
 * With a valid ticket: consume ticket + 1 generation (same as successful generate-image).
 * Without a ticket: return the image free — the provider already finished after a timed-out attempt.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    if (!isNanoBananaExpertConfigured()) {
      return NextResponse.json(
        { error: "Провайдер изображений не настроен.", code: "PROVIDER_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as RecoverBody;
    const generationId = body.generationId?.trim();

    if (!generationId) {
      return NextResponse.json({ error: "Не указан generation_id.", code: "MISSING_GENERATION_ID" }, { status: 400 });
    }

    const result = await recoverNanoBananaExpertImage(generationId);

    if (result.isFallback || (!result.imageBase64 && !result.imageUrl)) {
      const ticketId = body.imageGenerationTicket?.trim();
      return NextResponse.json(
        {
          error: result.error || IMAGE_GENERATION_RETRY_MESSAGE,
          code: "IMAGE_RECOVER_FAILED",
          generationId,
          imageGenerationTicket:
            ticketId && (await hasValidImageGenerationTicket(ticketId, userId)) ? ticketId : undefined,
          quota: await getUserQuota(userId)
        },
        { status: 404 }
      );
    }

    let charged = false;
    const ticketId = body.imageGenerationTicket?.trim();
    if (ticketId && (await hasValidImageGenerationTicket(ticketId, userId))) {
      const ticketAccepted = await consumeImageGenerationTicket(ticketId, userId);
      if (ticketAccepted) {
        const { consumed } = await consumeGeneration(userId);
        charged = consumed;
      }
    }

    return NextResponse.json({
      ...result,
      recovered: true,
      charged,
      quota: await getUserQuota(userId)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось проверить результат у провайдера.";
    console.error("[MarketCard AI] generate-image/recover failed:", message);
    return NextResponse.json({ error: IMAGE_GENERATION_RETRY_MESSAGE, code: "IMAGE_RECOVER_FAILED" }, { status: 500 });
  }
}
