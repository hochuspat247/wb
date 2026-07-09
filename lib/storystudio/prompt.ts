import type { CreateStoryInput, StoryCharacter, StoryProject } from "@/types/storystudio";
import { STORY_GENRES } from "@/lib/storystudio/constants";
import { formatCharactersForPrompt, formatRelationsForPrompt } from "@/lib/storystudio/relations";

function genreLabels(genres: string[]) {
  return genres
    .map((g) => STORY_GENRES.find((item) => item.id === g)?.label ?? g)
    .join(", ");
}

export function buildStoryFoundationPrompt(input: CreateStoryInput) {
  const premium = input.premiumMode
    ? "Режим Premium 18+: допускаются взрослые темы, откровенные сцены и грубая лексика, если это органично для жанра."
    : "Режим без ограничений по жанру, но без откровенного 18+ контента.";

  return `Ты — литературный редактор и сценарист мирового уровня. Создай основу художественного произведения на русском языке (если не указано иное).

Заголовок: ${input.title}
Основная идея: ${input.premise}
Жанры: ${genreLabels(input.genres)}
Язык: ${input.language === "en" ? "английский" : "русский"}
Целевой объём: ~${input.targetWordCount.toLocaleString("ru-RU")} слов
Персонажи (подсказка автора): ${input.charactersHint?.trim() || "на твоё усмотрение, 3–5 ключевых"}
${premium}

Верни JSON:
{
  "synopsis": "развёрнутый синопсис на 3-5 абзацев",
  "hook": "цепляющий хук в 1-2 предложения",
  "themes": ["тема1", "тема2", "тема3"],
  "world": {
    "setting": "где и в каком мире",
    "era": "эпоха/время",
    "tone": "тон повествования",
    "rules": ["правило мира 1", "правило 2"],
    "locations": ["локация1", "локация2", "локация3"]
  },
  "characters": [
    {
      "name": "имя",
      "role": "роль в истории",
      "age": "возраст",
      "appearance": "внешность 2-3 предложения",
      "personality": "характер",
      "backstory": "предыстория",
      "motivation": "мотивация",
      "secrets": "тайна или скрытый конфликт",
      "tags": ["тег1", "тег2"]
    }
  ],
  "relations": [
    {
      "fromName": "имя персонажа",
      "toName": "имя другого",
      "type": "ally|enemy|lover|family|mentor|rival|neutral",
      "label": "краткое описание связи",
      "intensity": 1-10
    }
  ],
  "outline": ["событие акта 1", "поворот", "кульминация", "финал"],
  "firstChapter": {
    "title": "название первой главы",
    "summary": "краткое содержание 2-3 предложения (без полного текста главы)"
  }
}

Важно: верни полный синопсис, минимум 3 персонажей с заполненными полями, мир и план сюжета. Полный текст первой главы генерировать не нужно.`;
}

export function buildCharacterPrompt(story: StoryProject, hint?: string, name?: string, role?: string) {
  const existing = story.characters.map((c) => c.name).join(", ");

  return `Ты — литературный редактор. Добавь нового персонажа в историю.

История: ${story.title}
Синопсис: ${story.synopsis}
Существующие персонажи: ${existing || "пока нет"}
Текущие связи на карте автора:
${formatRelationsForPrompt(story)}
Имя (если задано): ${name || "придумай подходящее"}
Роль: ${role || "на твоё усмотрение"}
Подсказка автора: ${hint?.trim() || "нет"}

Верни JSON:
{
  "character": {
    "name": "",
    "role": "",
    "age": "",
    "appearance": "",
    "personality": "",
    "backstory": "",
    "motivation": "",
    "secrets": "",
    "tags": []
  },
  "relations": [
    {
      "toName": "имя существующего персонажа",
      "type": "ally|enemy|lover|family|mentor|rival|neutral",
      "label": "описание связи",
      "intensity": 1-10
    }
  ]
}`;
}

export function buildChapterPrompt(story: StoryProject, chapterNumber: number, instructions?: string) {
  const prev = story.chapters.slice(-2).map((c) => `Глава ${c.number}: ${c.title}\n${c.summary}`).join("\n\n");
  const relationsBlock = formatRelationsForPrompt(story);
  const charactersBlock = formatCharactersForPrompt(story);

  return `Ты — писатель. Продолжи художественное произведение.

Название: ${story.title}
Синопсис: ${story.synopsis}
План: ${story.outline.join(" → ")}
Предыдущие главы:
${prev || "Это первая глава после уже сгенерированной основы."}

Персонажи:
${charactersBlock}

Связи на карте автора (обязательно отражай в сценах, конфликтах и диалогах):
${relationsBlock}

Номер новой главы: ${chapterNumber}
Инструкции автора: ${instructions?.trim() || "продолжай естественно, наращивай напряжение с учётом связей между героями"}

Верни JSON:
{
  "title": "название главы",
  "summary": "краткое содержание 2-3 предложения",
  "content": "полный текст главы 700-1100 слов, художественная проза на ${story.language === "en" ? "английском" : "русском"}"
}`;
}

export function buildCharacterPortraitPrompt(character: StoryCharacter, story: StoryProject) {
  return `Portrait illustration for a literary character. ${character.name}, ${character.role}. ${character.appearance}. Mood and world: ${story.world.tone}, ${story.world.setting}. Style: cinematic digital art, rich colors, character sheet portrait, no text, no watermark, vertical 3:4 composition, detailed face and costume.`;
}
