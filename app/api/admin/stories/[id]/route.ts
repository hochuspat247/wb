import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/admin";
import { db } from "@/lib/db";
import { storyProjects, users } from "@/lib/db/schema";
import type { StoryCharacter, StoryProject } from "@/types/storystudio";

export const runtime = "nodejs";

function hydrateCharacterImages(characters: StoryCharacter[]) {
  return characters.map((character) => ({
    ...character,
    imageDataUrl:
      character.imageUrl ??
      (character.imageBase64 && character.imageMimeType
        ? `data:${character.imageMimeType};base64,${character.imageBase64}`
        : null)
  }));
}

function hydrateStoryPayload(payload: StoryProject) {
  return {
    ...payload,
    characters: hydrateCharacterImages(payload.characters ?? [])
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [row] = await db
    .select({
      id: storyProjects.id,
      userId: storyProjects.userId,
      payload: storyProjects.payload,
      createdAt: storyProjects.createdAt,
      updatedAt: storyProjects.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(storyProjects)
    .leftJoin(users, eq(storyProjects.userId, users.id))
    .where(eq(storyProjects.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    payload: hydrateStoryPayload(row.payload)
  });
}
