import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { IMAGE_GENERATION_RETRY_MESSAGE } from "@/lib/ai/imageGenerationErrors";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { generateKvartovidListing as runGeneration } from "@/lib/kvartovid/generate";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
import { buildKvartovidSavedListing, saveKvartovidListing } from "@/lib/server/kvartovidListings";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import type { KvartovidListingInput } from "@/types/kvartovid";

export const runtime = "nodejs";
export const maxDuration = 300;

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateInput(body: KvartovidListingInput): string | null {
  if (!body.city?.trim()) return "Укажите город.";
  if (!body.rooms?.trim()) return "Укажите количество комнат.";
  if (!body.area || body.area <= 0) return "Укажите площадь в м².";
  if (!body.photos?.length) return "Загрузите хотя бы 3 фото.";
  if (body.photos.length < MIN_PHOTOS) return `Загрузите минимум ${MIN_PHOTOS} фото.`;
  if (body.photos.length > MAX_PHOTOS) return `Максимум ${MAX_PHOTOS} фото.`;

  for (const photo of body.photos) {
    if (!photo.base64 || !photo.mimeType) return "Некорректный формат фото.";
    if (!SUPPORTED_TYPES.includes(photo.mimeType)) return "Поддерживаются JPEG, PNG и WebP.";
    const approxBytes = Math.ceil((photo.base64.length * 3) / 4);
    if (approxBytes > MAX_PHOTO_BYTES) return "Каждое фото должно быть до 5 МБ.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы сгенерировать объявление." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    const quota = await getUserQuota(userId);
    if (!quota.canGenerate) {
      return NextResponse.json(
        {
          error: "Бесплатные генерации использованы. Купите пакет, чтобы продолжить.",
          code: "QUOTA_EXCEEDED",
          quota
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as KvartovidListingInput;
    const inputError = validateInput(body);
    if (inputError) {
      return NextResponse.json({ error: inputError }, { status: 400 });
    }

    const policy = scanTextForProhibitedContent(
      [
        body.city,
        body.district,
        body.metro,
        body.address,
        body.renovation,
        body.extraFeatures,
        body.price,
        body.rooms
      ]
        .map((v) => v?.trim())
        .filter(Boolean)
        .join("\n")
    );

    if (!policy.allowed) {
      return createContentPolicyBlockedResponse(policy);
    }

    const result = await runGeneration(body, {
      includeCover: body.includeCover !== false,
      includeFloorPlan: body.includeFloorPlan !== false
    });
    const updatedQuota = await consumeGeneration(userId);

    if (body.includeCover !== false && !result.coverImageBase64 && !result.coverImageUrl && !result.coverImageError) {
      result.coverImageError = IMAGE_GENERATION_RETRY_MESSAGE;
    }

    const listing = buildKvartovidSavedListing(body, result);
    await saveKvartovidListing(userId, listing);
    result.listingId = listing.id;

    return NextResponse.json({ ...result, quota: updatedQuota });
  } catch (error) {
    console.error("[kvartovid/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сгенерировать объявление." },
      { status: 500 }
    );
  }
}
