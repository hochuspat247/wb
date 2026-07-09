import type { StoryCharacter, StoryChapter, StoryProject } from "@/types/storystudio";
import type { VideoAspectRatio, VideoMotionStyle } from "@/types/video-generation";

const MOTION_HINTS: Record<VideoMotionStyle, string> = {
  soft_zoom: "Slow cinematic push-in, subtle breathing motion, gentle wind in hair or fabric.",
  premium_parallax: "Layered depth parallax — foreground character, midground atmosphere, background world shifting softly.",
  light_sweep: "Dramatic light sweep across the scene, lens flare, moody shadows moving.",
  marketplace_motion: "Dynamic camera orbit with atmospheric particles, cinematic reveal of the character."
};

export function buildStoryVideoSourceId(storyId: string, characterId: string) {
  return `story:${storyId}:${characterId}`;
}

export function parseStoryVideoSourceId(sourceId: string) {
  const match = sourceId.match(/^story:([^:]+):([^:]+)$/);
  if (!match) return null;
  return { storyId: match[1], characterId: match[2] };
}

export function buildStorySceneVideoPrompt(input: {
  story: StoryProject;
  character: StoryCharacter;
  chapter?: StoryChapter;
  sceneDescription?: string;
  motionStyle: VideoMotionStyle;
  aspectRatio: VideoAspectRatio;
}) {
  const scene =
    input.sceneDescription?.trim() ||
    input.chapter?.summary?.trim() ||
    `${input.character.name} in ${input.story.world.setting}. ${input.story.hook}`;

  return [
    "Image-to-video: animate this literary character portrait into a cinematic story scene.",
    "",
    `Story: ${input.story.title}`,
    `Genre tone: ${input.story.world.tone}`,
    `World: ${input.story.world.setting}, ${input.story.world.era}`,
    `Character: ${input.character.name} — ${input.character.role}`,
    `Appearance: ${input.character.appearance}`,
    `Scene: ${scene}`,
    "",
    "Motion direction:",
    MOTION_HINTS[input.motionStyle],
    "",
    "Requirements:",
    "- Preserve the character's face, costume and art style from the source portrait.",
    "- Add cinematic atmosphere: subtle environmental motion, lighting, mood matching the story.",
    "- No text overlays, no watermarks, no UI elements.",
    "- Feels like a premium book trailer or episodic series teaser.",
    `- Framing: ${input.aspectRatio}, vertical-friendly for social series.`
  ].join("\n");
}
