import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoStories, storyProjects } from "@/lib/db/schema";
import type { StoryProject } from "@/types/storystudio";

export type DemoStoryRecord = typeof demoStories.$inferSelect;

export async function createDemoStory(input: {
  guestId: string;
  userId?: string | null;
  clientIpHash?: string | null;
  story: StoryProject;
}) {
  const now = new Date();

  const [row] = await db
    .insert(demoStories)
    .values({
      id: input.story.id,
      guestId: input.guestId,
      userId: input.userId ?? null,
      clientIpHash: input.clientIpHash ?? null,
      status: "done",
      payload: input.story,
      createdAt: now
    })
    .returning();

  return row;
}

export async function getDemoStory(id: string) {
  return db.query.demoStories.findFirst({
    where: eq(demoStories.id, id)
  });
}

export function canReadDemoStory(row: DemoStoryRecord, identity: { guestId?: string | null; userId?: string | null }) {
  if (identity.userId && row.userId === identity.userId) {
    return true;
  }

  return Boolean(identity.guestId && row.guestId === identity.guestId);
}

export async function attachGuestStoriesToUser(guestId: string, userId: string) {
  const rows = await db.query.demoStories.findMany({
    where: and(eq(demoStories.guestId, guestId), isNull(demoStories.userId))
  });

  if (!rows.length) {
    return [];
  }

  await db
    .update(demoStories)
    .set({ userId })
    .where(and(eq(demoStories.guestId, guestId), isNull(demoStories.userId)));

  const migrated: StoryProject[] = [];

  for (const row of rows) {
    const existing = await db.query.storyProjects.findFirst({
      where: eq(storyProjects.id, row.id)
    });

    if (existing) {
      migrated.push(existing.payload);
      continue;
    }

    const now = new Date();
    await db.insert(storyProjects).values({
      id: row.id,
      userId,
      payload: row.payload,
      createdAt: row.createdAt,
      updatedAt: now
    });

    migrated.push(row.payload);
  }

  return migrated;
}
