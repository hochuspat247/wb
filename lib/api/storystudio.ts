import type { StoryProject, StoryEpisode, CreateStoryVideoInput } from "@/types/storystudio";

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
  language: "ru" | "en";
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
