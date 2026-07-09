import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";
import type { StoryProject } from "@/types/storystudio";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const rows = await db.query.storyProjects.findMany({
    where: eq(storyProjects.userId, userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)]
  });

  return NextResponse.json({
    stories: rows.map((row) => row.payload)
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const body = (await request.json()) as { story: StoryProject };
  const story = body.story;
  if (!story?.id || !story.title) {
    return NextResponse.json({ error: "Некорректные данные истории." }, { status: 400 });
  }

  const now = new Date();
  const existing = await db.query.storyProjects.findFirst({
    where: eq(storyProjects.id, story.id)
  });

  if (existing && existing.userId !== userId) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const payload: StoryProject = {
    ...story,
    updatedAt: now.toISOString()
  };

  if (existing) {
    await db
      .update(storyProjects)
      .set({ payload, updatedAt: now })
      .where(eq(storyProjects.id, story.id));
  } else {
    await db.insert(storyProjects).values({
      id: story.id,
      userId,
      payload: { ...payload, createdAt: payload.createdAt || now.toISOString() },
      createdAt: now,
      updatedAt: now
    });
  }

  return NextResponse.json({ story: payload });
}
