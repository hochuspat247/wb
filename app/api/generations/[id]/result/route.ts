import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { demoGenerations } from "@/lib/db/schema";
import { canReadOriginal, canReadPreview, getDemoGeneration } from "@/lib/server/demo-generations";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = request.headers.get("x-marketcard-guest-id") || new URL(request.url).searchParams.get("guestId");
  const row = await getDemoGeneration(id);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canReadPreview(row, { guestId, userId })) {
    return NextResponse.json({ error: userId ? "Forbidden" : "Unauthorized" }, { status: userId ? 403 : 401 });
  }

  const originalAvailable = Boolean(userId && row.userId === userId && (await canReadOriginal(row, userId)));

  return NextResponse.json({
    id: row.id,
    status: row.status,
    card: row.payload,
    previewUrl: `/api/generations/${row.id}/preview`,
    downloadOriginalUrl: originalAvailable ? `/api/generations/${row.id}/original` : undefined,
    originalAvailable,
    watermarkLocked: Boolean(userId && row.userId === userId && !originalAvailable)
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = request.headers.get("x-marketcard-guest-id") || new URL(request.url).searchParams.get("guestId");
  const row = await getDemoGeneration(id);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canReadPreview(row, { guestId, userId })) {
    return NextResponse.json({ error: userId ? "Forbidden" : "Unauthorized" }, { status: userId ? 403 : 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    generationRating?: number;
    generationRatingDismissed?: boolean;
  };
  const rating = Number(body.generationRating);
  const now = new Date().toISOString();
  const nextPayload = {
    ...row.payload,
    generationRating:
      Number.isInteger(rating) && rating >= 1 && rating <= 5
        ? (rating as 1 | 2 | 3 | 4 | 5)
        : row.payload.generationRating,
    generationRatedAt: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? now : row.payload.generationRatedAt,
    generationRatingDismissedAt: body.generationRatingDismissed ? now : row.payload.generationRatingDismissedAt
  };

  await db
    .update(demoGenerations)
    .set({ payload: nextPayload })
    .where(eq(demoGenerations.id, row.id));

  const originalAvailable = Boolean(userId && row.userId === userId && (await canReadOriginal(row, userId)));

  return NextResponse.json({
    id: row.id,
    status: row.status,
    card: nextPayload,
    previewUrl: `/api/generations/${row.id}/preview`,
    downloadOriginalUrl: originalAvailable ? `/api/generations/${row.id}/original` : undefined,
    originalAvailable,
    watermarkLocked: Boolean(userId && row.userId === userId && !originalAvailable)
  });
}
