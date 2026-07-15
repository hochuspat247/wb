import type { StoryProject, StoryEpisode, CreateStoryVideoInput, StoryLanguage } from "@/types/storystudio";

export async function fetchStoryProjects() {
  const response = await fetch("/api/storystudio/stories", { cache: "no-store" });
  if (!response.ok) throw new Error("FAILED_TO_LOAD_STORIES");
  const data = (await response.json()) as { stories: StoryProject[] };
  return data.stories;
}

export async function fetchStoryProject(id: string) {
  const response = await fetch(`/api/storystudio/stories/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("FAILED_TO_LOAD_STORY");
  const data = (await response.json()) as { story: StoryProject };
  return data.story;
}

export async function saveStoryProject(story: StoryProject) {
  const response = await fetch("/api/storystudio/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ story })
  });
  if (!response.ok) throw new Error("FAILED_TO_SAVE_STORY");
  const data = (await response.json()) as { story: StoryProject };
  return data.story;
}

export async function updateStoryProject(story: StoryProject) {
  const response = await fetch(`/api/storystudio/stories/${story.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ story })
  });
  if (!response.ok) throw new Error("FAILED_TO_UPDATE_STORY");
  const data = (await response.json()) as { story: StoryProject };
  return data.story;
}

export async function deleteStoryProject(id: string) {
  const response = await fetch(`/api/storystudio/stories/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("FAILED_TO_DELETE_STORY");
}

export async function generateStoryFoundation(input: {
  title: string;
  premise: string;
  charactersHint?: string;
  genres: string[];
  language: StoryLanguage;
  targetWordCount: number;
  premiumMode?: boolean;
}) {
  const response = await fetch("/api/storystudio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error || "GENERATION_FAILED") as Error & { code?: string; quota?: unknown };
    err.code = data.code;
    (err as { quota?: unknown }).quota = data.quota;
    throw err;
  }
  return data as { story: StoryProject; quota: unknown };
}

export async function generateStoryDemo(
  input: {
    title: string;
    premise: string;
    charactersHint?: string;
    genres: string[];
    language: StoryLanguage;
    targetWordCount: number;
    premiumMode?: boolean;
  } & { guestId: string }
) {
  const response = await fetch("/api/storystudio/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error || "DEMO_GENERATION_FAILED") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data as { story: StoryProject; guestId: string };
}

export async function migrateGuestStories(guestId: string) {
  const response = await fetch("/api/storystudio/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId })
  });
  if (!response.ok) {
    throw new Error("FAILED_TO_MIGRATE_STORIES");
  }
  const data = (await response.json()) as { migrated: number; stories: StoryProject[] };
  return data;
}

export async function regenerateStoryFoundation(storyId: string) {
  const response = await fetch(`/api/storystudio/stories/${storyId}/regenerate`, {
    method: "POST"
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error || "REGENERATION_FAILED") as Error & { code?: string; quota?: unknown };
    err.code = data.code;
    (err as { quota?: unknown }).quota = data.quota;
    throw err;
  }
  return data as { story: StoryProject; quota: unknown };
}

export async function generateStoryCharacter(storyId: string, options?: { hint?: string; name?: string; role?: string }) {
  const response = await fetch("/api/storystudio/characters/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId, ...options })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "CHARACTER_GENERATION_FAILED");
  return data as { story: StoryProject; quota: unknown };
}

export async function generateStoryChapter(storyId: string, options?: { instructions?: string }) {
  const response = await fetch("/api/storystudio/chapters/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId, ...options })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "CHAPTER_GENERATION_FAILED");
  return data as { story: StoryProject; quota: unknown };
}

export async function generateCharacterPortrait(storyId: string, characterId: string) {
  const response = await fetch("/api/storystudio/characters/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId, characterId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "PORTRAIT_GENERATION_FAILED");
  return data as { story: StoryProject; quota: unknown };
}

export async function createStoryVideoOrder(
  input: CreateStoryVideoInput & { useVideoCredit?: boolean; customerEmail?: string; episodeTitle?: string }
) {
  const response = await fetch("/api/storystudio/video/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.code === "EMAIL_REQUIRED") throw new Error("EMAIL_REQUIRED");
    throw new Error(data.error || "VIDEO_ORDER_FAILED");
  }
  return data as {
    orderId: string;
    story: StoryProject;
    episode: StoryEpisode;
    paymentUrl?: string;
    isFree?: boolean;
    usedVideoCredit?: boolean;
  };
}

export { fetchVideoOrderStatus } from "@/lib/api/video";

export async function createStoryPayment(count: number, customerEmail?: string) {
  const response = await fetch("/api/storystudio/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, customerEmail })
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("UNAUTHORIZED");
    const data = (await response.json().catch(() => null)) as { code?: string; error?: string } | null;
    if (data?.code === "EMAIL_REQUIRED") throw new Error("EMAIL_REQUIRED");
    throw new Error(data?.error || "FAILED_TO_CREATE_PAYMENT");
  }
  return response.json() as Promise<{ id: string; confirmationUrl: string }>;
}

export async function analyzeStory(storyId: string, focus?: string) {
  const response = await fetch("/api/storystudio/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId, focus: focus?.trim() || undefined })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "ANALYSIS_FAILED");
  return data as { story: StoryProject; quota: unknown };
}

export async function generateStoryMedia(input: {
  storyId: string;
  kind: "character" | "world" | "chapter" | "fact";
  title?: string;
  prompt?: string;
  entityId?: string;
  showInReader?: boolean;
}) {
  const response = await fetch("/api/storystudio/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "MEDIA_GENERATION_FAILED");
  return data as { story: StoryProject; asset: unknown; quota: unknown };
}

export async function setStoryShare(storyId: string, isPublic: boolean) {
  const response = await fetch(`/api/storystudio/stories/${storyId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "SHARE_FAILED");
  return data as { story: StoryProject; shareUrl: string };
}

export async function fetchSharedStory(shareId: string) {
  const response = await fetch(`/api/storystudio/share/${shareId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("FAILED_TO_LOAD_SHARED_STORY");
  const data = (await response.json()) as { story: StoryProject };
  return data.story;
}
