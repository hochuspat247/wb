import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";
import type { StoryProject } from "@/types/storystudio";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ shareId: string }> };

function toPublicStory(story: StoryProject): StoryProject {
  return {
    ...story,
    media: (story.media ?? []).map((asset) => ({
      ...asset,
      // keep binary for reader if present in shared snapshot
    })),
    analysis: null
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareId } = await context.params;
  if (!shareId?.trim()) {
    return NextResponse.json({ error: "Некорректная ссылка." }, { status: 400 });
  }

  // JSON payload fields — scan recent projects; shareId is unique short string
  const rows = await db
    .select()
    .from(storyProjects)
    .where(sql`json_extract(${storyProjects.payload}, '$.shareId') = ${shareId}`)
    .limit(1);

  const row = rows[0];
  if (!row || !row.payload.isPublic || row.payload.shareId !== shareId) {
    return NextResponse.json({ error: "История не найдена или доступ закрыт." }, { status: 404 });
  }

  return NextResponse.json({ story: toPublicStory(row.payload) });
}
