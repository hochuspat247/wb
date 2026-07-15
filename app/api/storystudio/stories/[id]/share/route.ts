import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function makeShareId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { isPublic?: boolean };
  const isPublic = Boolean(body.isPublic);

  const row = await db.query.storyProjects.findFirst({
    where: and(eq(storyProjects.id, id), eq(storyProjects.userId, userId))
  });
  if (!row) {
    return NextResponse.json({ error: "История не найдена." }, { status: 404 });
  }

  const shareId = row.payload.shareId || makeShareId();
  const story = {
    ...row.payload,
    shareId,
    isPublic,
    updatedAt: new Date().toISOString()
  };

  const now = new Date();
  await db
    .update(storyProjects)
    .set({ payload: story, updatedAt: now })
    .where(eq(storyProjects.id, id));

  return NextResponse.json({ story, shareUrl: `/storystudio/s/${shareId}` });
}
