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

function parseJson<T>(text: string): T {
  return JSON.parse(extractJsonObject(text)) as T;
}

function mapCharacters(raw: RawCharacter[]): StoryCharacter[] {
  return raw.map((c, index) => ({
    id: crypto.randomUUID(),
    name: String(c.name),
    role: String(c.role),
    age: c.age ? String(c.age) : undefined,
    appearance: String(c.appearance),
    personality: String(c.personality),
    backstory: String(c.backstory),
    motivation: String(c.motivation),
    secrets: c.secrets ? String(c.secrets) : undefined,
    tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
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

export async function generateStoryFoundation(input: CreateStoryInput): Promise<StoryProject> {
  const rawText = await callGigaChatJson(buildStoryFoundationPrompt(input), { maxTokens: 4000 });
  const data = parseJson<{
    synopsis: string;
    hook: string;
    themes: string[];
    world: StoryProject["world"];
    characters: RawCharacter[];
    relations: RawRelation[];
    outline: string[];
    firstChapter: { title: string; summary: string; content: string };
  }>(rawText);

  const now = new Date().toISOString();
  const characters = mapCharacters(data.characters ?? []);
  const relations = mapRelations(data.relations ?? [], characters);
  const firstChapter: StoryChapter = {
    id: crypto.randomUUID(),
    number: 1,
    title: data.firstChapter?.title ?? "Глава 1",
    summary: data.firstChapter?.summary ?? "",
    content: data.firstChapter?.content ?? "",
    wordCount: countWords(data.firstChapter?.content ?? ""),
    createdAt: now,
    updatedAt: now
  };

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
    themes: Array.isArray(data.themes) ? data.themes.map(String) : [],
    world: data.world ?? {
      setting: "",
      era: "",
      tone: "",
      rules: [],
      locations: []
    },
    characters,
    relations,
    chapters: firstChapter.content ? [firstChapter] : [],
    episodes: [],
    outline: Array.isArray(data.outline) ? data.outline.map(String) : [],
    status: "in_progress",
    createdAt: now,
    updatedAt: now
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
  const character: StoryCharacter = {
    ...mapped,
    id: crypto.randomUUID(),
    position: defaultPosition(story.characters.length, story.characters.length + 1)
  };
  const allCharacters = [...story.characters, character];
  const newRelations = mapRelations(data.relations ?? [], allCharacters, character.name);

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
  const content = String(data.content ?? "");

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
