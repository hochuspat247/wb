import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, videoGenerationOrders } from "@/lib/db/schema";
import { getCardSourceImageData, parseSourceImageOrderId, verifySignedSourceImageAccess } from "@/lib/server/videoSourceImage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderId: orderIdParam } = await context.params;
  const orderId = parseSourceImageOrderId(orderIdParam);
  const url = new URL(request.url);
  const expires = url.searchParams.get("expires") || "";
  const signature = url.searchParams.get("sig") || "";

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

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const image = getCardSourceImageData(card.payload);
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
