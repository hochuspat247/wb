import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";
import type { StoryProject } from "@/types/storystudio";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const row = await db.query.storyProjects.findFirst({
    where: and(eq(storyProjects.id, id), eq(storyProjects.userId, userId))
  });

  if (!row) {
    return NextResponse.json({ error: "История не найдена." }, { status: 404 });
  }

  return NextResponse.json({ story: row.payload });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const body = (await request.json()) as { story: StoryProject };
  const story = body.story;
  if (!story || story.id !== id) {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  const now = new Date();
  const result = await db
    .update(storyProjects)
    .set({ payload: { ...story, updatedAt: now.toISOString() }, updatedAt: now })
    .where(and(eq(storyProjects.id, id), eq(storyProjects.userId, userId)))
    .returning({ id: storyProjects.id });

  if (!result.length) {
    return NextResponse.json({ error: "История не найдена." }, { status: 404 });
  }

  return NextResponse.json({ story: { ...story, updatedAt: now.toISOString() } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  await db
    .delete(storyProjects)
    .where(and(eq(storyProjects.id, id), eq(storyProjects.userId, userId)));

  return NextResponse.json({ ok: true });
}
