import type { StoryProject } from "@/types/storystudio";

export function isStoryFoundationEmpty(
  story: Pick<StoryProject, "synopsis" | "characters" | "chapters" | "outline" | "world">
) {
  const hasSynopsis = Boolean(story.synopsis?.trim());
  const hasCharacters = story.characters.length > 0;
  const hasOutline = story.outline.length > 0;
  const hasWorld = Boolean(story.world?.setting?.trim() || story.world?.tone?.trim());
  return !hasSynopsis && !hasCharacters && !hasOutline && !hasWorld;
}
