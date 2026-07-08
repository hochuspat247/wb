import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/admin";
import { db } from "@/lib/db";
import { demoGenerations, users } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [demo] = await db
    .select({
      id: demoGenerations.id,
      guestId: demoGenerations.guestId,
      userId: demoGenerations.userId,
      status: demoGenerations.status,
      payload: demoGenerations.payload,
      originalImageBase64: demoGenerations.originalImageBase64,
      originalImageMimeType: demoGenerations.originalImageMimeType,
      previewImageBase64: demoGenerations.previewImageBase64,
      previewImageMimeType: demoGenerations.previewImageMimeType,
      createdAt: demoGenerations.createdAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(demoGenerations)
    .leftJoin(users, eq(demoGenerations.userId, users.id))
    .where(eq(demoGenerations.id, id))
    .limit(1);

  if (!demo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: demo.id,
    guestId: demo.guestId,
    userId: demo.userId,
    userName: demo.userName,
    userEmail: demo.userEmail,
    status: demo.status,
    createdAt: demo.createdAt,
    payload: demo.payload,
    originalImageDataUrl: `data:${demo.originalImageMimeType};base64,${demo.originalImageBase64}`,
    previewImageDataUrl: `data:${demo.previewImageMimeType};base64,${demo.previewImageBase64}`
  });
}
