import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { createKlingVideo, pollKlingVideo } from "@/lib/ai/klingVideo";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { calculateVideoPriceRub } from "@/config/video-pricing";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";
import type { GenerateVideoInput } from "@/types/product-card";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_VIDEO_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type GenerateVideoBody = GenerateVideoInput & {
  taskId?: string;
  taskType?: "image2video" | "text2video";
};

async function getVideoPriceForUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  const isFree = Boolean(user && hasUnlimitedGenerations(user));

  return {
    priceRub: isFree ? 0 : calculateVideoPriceRub("8", "standard"),
    isFree
  };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Войдите в аккаунт, чтобы проверить видео." }, { status: 401 });
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");
  const taskType = url.searchParams.get("taskType") === "text2video" ? "text2video" : "image2video";

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const result = await pollKlingVideo(taskId, "", taskType);
  const price = await getVideoPriceForUser(session.user.id);
  return NextResponse.json({ ...result, ...price });
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы сгенерировать видео." }, { status: 401 });
    }

    const price = await getVideoPriceForUser(session.user.id);
    const body = (await request.json()) as GenerateVideoBody;

    if (body.taskId) {
      const taskType = body.taskType || "image2video";
      const result = await pollKlingVideo(body.taskId, body.prompt || "", taskType);
      return NextResponse.json({ ...result, ...price });
    }

    const validationError = validateVideoInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await createKlingVideo(body);
    return NextResponse.json({ ...result, ...price });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сгенерировать видео.";
    console.error("[MarketCard AI] generate-video failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function validateVideoInput(input: GenerateVideoInput) {
  if (!input.prompt?.trim() && !input.productDescription?.trim() && !input.title?.trim()) {
    return "Добавьте описание товара или prompt для видео.";
  }

  if (input.imageMimeType && !SUPPORTED_IMAGE_TYPES.includes(input.imageMimeType)) {
    return "Для видео поддерживаются только image/jpeg, image/png и image/webp.";
  }

  if (input.imageBase64) {
    const size = Buffer.byteLength(input.imageBase64, "base64");

    if (size > MAX_VIDEO_SOURCE_IMAGE_BYTES) {
      return "Изображение для видео слишком большое. Загрузите файл до 8 МБ.";
    }
  }

  return null;
}
