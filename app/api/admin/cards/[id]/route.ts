import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/admin";
import { hydrateCardPayloadWithVideos } from "@/lib/server/cardVideos";
import { db } from "@/lib/db";
import { demoGenerations, productCards, users } from "@/lib/db/schema";
import type { ProductCardResult } from "@/types/product-card";

export const runtime = "nodejs";

function hasGeneratedImage(card: ProductCardResult) {
  return Boolean(card.generatedImageUrl || card.generatedImageDataUrl || card.generatedImageBase64);
}

async function hydrateMissingGeneratedImage(cardId: string, userId: string, payload: ProductCardResult) {
  if (hasGeneratedImage(payload)) {
    return payload;
  }

  const [demo] = await db
    .select({
      originalImageBase64: demoGenerations.originalImageBase64,
      originalImageMimeType: demoGenerations.originalImageMimeType
    })
    .from(demoGenerations)
    .where(
      and(
        eq(demoGenerations.userId, userId),
        sql`json_extract(${demoGenerations.payload}, '$.id') = ${cardId}`
      )
    )
    .limit(1);

  if (!demo?.originalImageBase64 || !demo.originalImageMimeType) {
    return payload;
  }

  return {
    ...payload,
    generatedImageUrl: payload.generatedImageUrl ?? null,
    generatedImageDataUrl: payload.generatedImageDataUrl,
    generatedImageBase64: demo.originalImageBase64,
    generatedImageMimeType: demo.originalImageMimeType
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [card] = await db
    .select({
      id: productCards.id,
      userId: productCards.userId,
      payload: productCards.payload,
      createdAt: productCards.createdAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(productCards)
    .leftJoin(users, eq(productCards.userId, users.id))
    .where(eq(productCards.id, id))
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hydratedPayload = await hydrateMissingGeneratedImage(card.id, card.userId, card.payload);

  return NextResponse.json({
    id: card.id,
    userId: card.userId,
    userName: card.userName,
    userEmail: card.userEmail,
    createdAt: card.createdAt,
    payload: await hydrateCardPayloadWithVideos(hydratedPayload)
  });
}
