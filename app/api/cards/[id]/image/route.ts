import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCardImagePayload } from "@/lib/server/cards";
import { addWatermarkToImageBuffer } from "@/lib/server/watermark";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getImageBuffer(card: {
  generatedImageBase64?: string | null;
  generatedImageMimeType?: string | null;
}) {
  if (!card.generatedImageBase64 || !card.generatedImageMimeType) {
    return null;
  }

  return {
    buffer: Buffer.from(card.generatedImageBase64, "base64"),
    mimeType: card.generatedImageMimeType
  };
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const variant = new URL(request.url).searchParams.get("variant") === "original" ? "original" : "preview";
  const payload = await getUserCardImagePayload(userId, id);

  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const image = getImageBuffer(payload.card);

  if (!image) {
    return NextResponse.json({ error: "Image not available" }, { status: 404 });
  }

  if (variant === "original" && !payload.downloadUnlocked) {
    return NextResponse.json(
      {
        error: "Скачивание без водяного знака доступно для первой карточки или после покупки пакета.",
        code: "WATERMARK_LOCKED"
      },
      { status: 402 }
    );
  }

  const outputBuffer =
    variant === "original" || payload.downloadUnlocked
      ? image.buffer
      : await addWatermarkToImageBuffer(image.buffer);

  const mimeType = variant === "original" || payload.downloadUnlocked ? image.mimeType : "image/png";
  const extension = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("svg") ? "svg" : "png";
  const disposition =
    variant === "original"
      ? `attachment; filename="marketcard-${id}.${extension}"`
      : `inline; filename="marketcard-preview-${id}.png"`;

  return new Response(new Uint8Array(outputBuffer), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": disposition
    }
  });
}
