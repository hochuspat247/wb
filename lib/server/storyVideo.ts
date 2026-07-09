import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { storyProjects, videoGenerationOrders } from "@/lib/db/schema";
import { parseStoryVideoSourceId } from "@/lib/storystudio/videoPrompt";
import type { StoryCharacter, StoryEpisode, StoryProject } from "@/types/storystudio";
import type { VideoGenerationRecord } from "@/types/video-generation";

export function getStoryCharacterImageData(character: StoryCharacter): { base64: string; mimeType: string } | null {
  if (character.imageBase64) {
    return {
      base64: character.imageBase64,
      mimeType: character.imageMimeType || "image/png"
    };
  }

  return null;
}

export async function getStoryProjectForUser(storyId: string, userId: string) {
  const row = await db.query.storyProjects.findFirst({
    where: and(eq(storyProjects.id, storyId), eq(storyProjects.userId, userId))
  });

  return row?.payload ?? null;
}

export async function getStoryCharacterSourceImage(storyId: string, characterId: string, userId?: string) {
  const row = await db.query.storyProjects.findFirst({
    where: userId
      ? and(eq(storyProjects.id, storyId), eq(storyProjects.userId, userId))
      : eq(storyProjects.id, storyId)
  });

  if (!row) return null;

  const character = row.payload.characters.find((c) => c.id === characterId);
  if (!character) return null;

  return getStoryCharacterImageData(character);
}

export async function saveStoryProjectPayload(story: StoryProject, userId: string) {
  const now = new Date();
  await db
    .update(storyProjects)
    .set({ payload: story, updatedAt: now })
    .where(and(eq(storyProjects.id, story.id), eq(storyProjects.userId, userId)));
}

export function ensureEpisodes(story: StoryProject): StoryProject {
  if (story.episodes) return story;
  return { ...story, episodes: [] };
}

export function upsertStoryEpisode(story: StoryProject, episode: StoryEpisode): StoryProject {
  const episodes = story.episodes ?? [];
  const index = episodes.findIndex((e) => e.id === episode.id);
  const next = index >= 0 ? episodes.map((e, i) => (i === index ? episode : e)) : [...episodes, episode];
  return { ...story, episodes: next, updatedAt: new Date().toISOString() };
}

export async function syncCompletedVideoToStory(order: VideoGenerationRecord | null) {
  if (!order || order.status !== "done" || !order.originalVideoUrl) return;

  const ref = parseStoryVideoSourceId(order.sourceGenerationId);
  if (!ref) return;

  const row = await db.query.storyProjects.findFirst({
    where: eq(storyProjects.id, ref.storyId)
  });

  if (!row) return;

  const story = ensureEpisodes(row.payload);
  const episodes = story.episodes ?? [];
  const index = episodes.findIndex((e) => e.videoOrderId === order.id);

  if (index < 0) return;

  const updatedEpisode: StoryEpisode = {
    ...episodes[index],
    status: "done",
    videoUrl: order.originalVideoUrl,
    updatedAt: new Date().toISOString()
  };

  const nextStory = upsertStoryEpisode(story, updatedEpisode);

  await db
    .update(storyProjects)
    .set({ payload: nextStory, updatedAt: new Date() })
    .where(eq(storyProjects.id, ref.storyId));
}
