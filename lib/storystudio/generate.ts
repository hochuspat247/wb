import { callGigaChatJson } from "@/lib/ai/gigachat";
import { extractJsonObject } from "@/lib/json";
import {
  buildChapterPrompt,
  buildCharacterPrompt,
  buildStoryFoundationPrompt
} from "@/lib/storystudio/prompt";
import type {
  CharacterRelation,
  CreateStoryInput,
  StoryCharacter,
  StoryChapter,
  StoryProject
} from "@/types/storystudio";
import { isStoryFoundationEmpty } from "@/lib/storystudio/storyState";

type RawCharacter = {
  name: string;
  role: string;
  age?: string;
  appearance: string;
  personality: string;
  backstory: string;
  motivation: string;
  secrets?: string;
  tags?: string[];
};

type RawRelation = {
  fromName?: string;
  toName: string;
  type: CharacterRelation["type"];
  label: string;
  intensity: number;
};

type FoundationResponse = {
  synopsis: string;
  hook: string;
  themes: string[];
  world: StoryProject["world"];
  characters: RawCharacter[];
  relations: RawRelation[];
  outline: string[];
  firstChapter?: { title: string; summary: string; content?: string };
};

function parseJson<T>(text: string): T {
  return JSON.parse(extractJsonObject(text)) as T;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeWorld(world: FoundationResponse["world"] | undefined): StoryProject["world"] {
  if (!world || typeof world !== "object") {
    return { setting: "", era: "", tone: "", rules: [], locations: [] };
  }

  return {
    setting: String((world as StoryProject["world"]).setting ?? ""),
    era: String((world as StoryProject["world"]).era ?? ""),
    tone: String((world as StoryProject["world"]).tone ?? ""),
    rules: asArray((world as StoryProject["world"]).rules).map(String).filter(Boolean),
    locations: asArray((world as StoryProject["world"]).locations).map(String).filter(Boolean)
  };
}

function mapCharacters(raw: RawCharacter[]): StoryCharacter[] {
  return raw
    .filter((c) => c?.name?.trim())
    .map((c, index) => ({
      id: crypto.randomUUID(),
      name: String(c.name),
      role: String(c.role ?? ""),
      age: c.age ? String(c.age) : undefined,
      appearance: String(c.appearance ?? ""),
      personality: String(c.personality ?? ""),
      backstory: String(c.backstory ?? ""),
      motivation: String(c.motivation ?? ""),
      secrets: c.secrets ? String(c.secrets) : undefined,
      tags: asArray(c.tags).map(String),
      position: defaultPosition(index, raw.length)
    }));
}

function defaultPosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 140;
  return {
    x: 200 + Math.cos(angle) * radius,
    y: 200 + Math.sin(angle) * radius
  };
}

function mapRelations(
  raw: RawRelation[],
  characters: StoryCharacter[],
  defaultFromName?: string
): CharacterRelation[] {
  const byName = new Map(characters.map((c) => [c.name.toLowerCase(), c.id]));

  return raw
    .map((r) => {
      const fromId = byName.get((r.fromName ?? defaultFromName ?? "").toLowerCase());
      const toId = byName.get(r.toName.toLowerCase());
      if (!fromId || !toId || fromId === toId) return null;

      return {
        id: crypto.randomUUID(),
        fromId,
        toId,
        type: r.type,
        label: String(r.label),
        intensity: Math.min(10, Math.max(1, Number(r.intensity) || 5))
      };
    })
    .filter(Boolean) as CharacterRelation[];
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export { isStoryFoundationEmpty } from "@/lib/storystudio/storyState";

function isFoundationResponseEmpty(data: FoundationResponse) {
  const characters = asArray(data.characters);
  return (
    !String(data.synopsis ?? "").trim() &&
    characters.length === 0 &&
    asArray(data.outline).length === 0 &&
    !String(data.world?.setting ?? "").trim()
  );
}

async function fetchFoundationResponse(input: CreateStoryInput, attempt: number): Promise<FoundationResponse> {
  const rawText = await callGigaChatJson(buildStoryFoundationPrompt(input), {
    maxTokens: 6000,
    temperature: attempt === 0 ? 0.35 : 0.5
  });
  return parseJson<FoundationResponse>(rawText);
}

function buildStoryFromFoundation(input: CreateStoryInput, data: FoundationResponse): StoryProject {
  const now = new Date().toISOString();
  const characters = mapCharacters(asArray(data.characters));
  const relations = mapRelations(asArray(data.relations), characters);
  const firstChapterContent = String(data.firstChapter?.content ?? "").trim();
  const firstChapter: StoryChapter | null = firstChapterContent
    ? {
        id: crypto.randomUUID(),
        number: 1,
        title: data.firstChapter?.title ?? "Глава 1",
        summary: data.firstChapter?.summary ?? "",
        content: firstChapterContent,
        wordCount: countWords(firstChapterContent),
        createdAt: now,
        updatedAt: now
      }
    : null;

  return {
    id: crypto.randomUUID(),
    title: input.title,
    premise: input.premise,
    genres: input.genres,
    language: input.language,
    targetWordCount: input.targetWordCount,
    premiumMode: Boolean(input.premiumMode),
    synopsis: String(data.synopsis ?? ""),
    hook: String(data.hook ?? ""),
    themes: asArray(data.themes).map(String).filter(Boolean),
    world: normalizeWorld(data.world),
    characters,
    relations,
    chapters: firstChapter ? [firstChapter] : [],
    episodes: [],
    outline: asArray(data.outline).map(String).filter(Boolean),
    status: "in_progress",
    createdAt: now,
    updatedAt: now
  };
}

async function ensureFirstChapter(story: StoryProject): Promise<StoryProject> {
  if (story.chapters.length > 0 || isStoryFoundationEmpty(story)) {
    return story;
  }

  try {
    const chapter = await generateStoryChapter(story, 1);
    return {
      ...story,
      chapters: [chapter],
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("[storystudio] first chapter generation failed", error);
    return story;
  }
}

async function buildFoundationProject(input: CreateStoryInput): Promise<StoryProject> {
  let data = await fetchFoundationResponse(input, 0);

  if (isFoundationResponseEmpty(data)) {
    console.warn("[storystudio] empty foundation response, retrying");
    data = await fetchFoundationResponse(input, 1);
  }

  if (isFoundationResponseEmpty(data)) {
    throw new Error("AI не вернул содержимое истории. Попробуйте ещё раз.");
  }

  const story = await ensureFirstChapter(buildStoryFromFoundation(input, data));

  if (isStoryFoundationEmpty(story)) {
    throw new Error("Не удалось сгенерировать основу истории. Попробуйте ещё раз.");
  }

  return story;
}

export async function generateStoryFoundation(input: CreateStoryInput): Promise<StoryProject> {
  return buildFoundationProject(input);
}

export async function regenerateStoryFoundation(story: StoryProject): Promise<StoryProject> {
  const input: CreateStoryInput = {
    title: story.title,
    premise: story.premise,
    charactersHint: undefined,
    genres: story.genres,
    language: story.language,
    targetWordCount: story.targetWordCount,
    premiumMode: story.premiumMode
  };

  const generated = await buildFoundationProject(input);

  return {
    ...generated,
    id: story.id,
    createdAt: story.createdAt,
    episodes: story.episodes ?? []
  };
}

export async function generateStoryCharacter(
  story: StoryProject,
  options: { hint?: string; name?: string; role?: string }
) {
  const rawText = await callGigaChatJson(buildCharacterPrompt(story, options.hint, options.name, options.role), {
    maxTokens: 2000
  });
  const data = parseJson<{ character: RawCharacter; relations: RawRelation[] }>(rawText);
  const mapped = mapCharacters([data.character])[0];
  if (!mapped) {
    throw new Error("AI не вернул персонажа.");
  }

  const character: StoryCharacter = {
    ...mapped,
    id: crypto.randomUUID(),
    position: defaultPosition(story.characters.length, story.characters.length + 1)
  };
  const allCharacters = [...story.characters, character];
  const newRelations = mapRelations(asArray(data.relations), allCharacters, character.name);

  return { character, relations: newRelations };
}

export async function generateStoryChapter(
  story: StoryProject,
  chapterNumber: number,
  instructions?: string
) {
  const rawText = await callGigaChatJson(buildChapterPrompt(story, chapterNumber, instructions), {
    maxTokens: 3500
  });
  const data = parseJson<{ title: string; summary: string; content: string }>(rawText);
  const now = new Date().toISOString();
  const content = String(data.content ?? "").trim();

  if (!content) {
    throw new Error("AI не вернул текст главы.");
  }

  const chapter: StoryChapter = {
    id: crypto.randomUUID(),
    number: chapterNumber,
    title: String(data.title ?? `Глава ${chapterNumber}`),
    summary: String(data.summary ?? ""),
    content,
    wordCount: countWords(content),
    createdAt: now,
    updatedAt: now
  };

  return chapter;
}
