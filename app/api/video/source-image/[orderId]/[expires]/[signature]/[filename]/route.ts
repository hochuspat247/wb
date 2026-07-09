import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, videoGenerationOrders } from "@/lib/db/schema";
import { getCardSourceImageData, verifySignedSourceImageAccess } from "@/lib/server/videoSourceImage";
import { getStoryCharacterSourceImage } from "@/lib/server/storyVideo";
import { parseStoryVideoSourceId } from "@/lib/storystudio/videoPrompt";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    orderId: string;
    expires: string;
    signature: string;
    filename: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderId, expires, signature, filename } = await context.params;

  if (!/^image\.(png|jpe?g|webp)$/i.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!verifySignedSourceImageAccess(orderId, expires, signature)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await db.query.videoGenerationOrders.findFirst({
    where: eq(videoGenerationOrders.id, orderId)
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const card = await db.query.productCards.findFirst({
    where: eq(productCards.id, order.sourceGenerationId)
  });

  let image = card ? getCardSourceImageData(card.payload) : null;

  if (!image) {
    const storyRef = parseStoryVideoSourceId(order.sourceGenerationId);
    if (storyRef) {
      image = (await getStoryCharacterSourceImage(storyRef.storyId, storyRef.characterId)) ?? null;
    }
  }

  if (!image) {
    return NextResponse.json({ error: "Source image not found" }, { status: 404 });
  }

  const buffer = Buffer.from(image.base64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=3600"
    }
  });
}
