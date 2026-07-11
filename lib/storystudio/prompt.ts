import type { CreateStoryInput, StoryCharacter, StoryProject } from "@/types/storystudio";
import { STORY_GENRES } from "@/lib/storystudio/constants";
import { formatCharactersForPrompt, formatRelationsForPrompt } from "@/lib/storystudio/relations";

function genreLabels(genres: string[]) {
  return genres
    .map((g) => STORY_GENRES.find((item) => item.id === g)?.label ?? g)
    .join(", ");
}

function premiumModeLine(premiumMode: boolean) {
  return premiumMode
    ? "Режим Премиум 18+: допускаются взрослые темы, откровенные сцены и грубая лексика, если это органично для жанра."
    : "Режим без ограничений по жанру, но без откровенного 18+ контента.";
}

export function buildStoryFoundationPrompt(input: CreateStoryInput) {
  const premium = premiumModeLine(Boolean(input.premiumMode));

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
      "appearance": "внешность 2-3 предложения — конкретно и визуально для иллюстрации: форма тела, цвет, одежда, отличительные черты (Колобок = круглый пшеничный блин с лицом, не человек)",
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
  const premium = premiumModeLine(story.premiumMode);

  return `Ты — литературный редактор. Добавь нового персонажа в историю.

${premium}

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
  const premium = premiumModeLine(story.premiumMode);

  return `Ты — писатель. Продолжи художественное произведение.

${premium}

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
  const subjectHint = getPortraitSubjectHint(character);
  const appearance = character.appearance.trim() || character.role;
  const tags = character.tags.length ? `Traits: ${character.tags.join(", ")}.` : "";

  return [
    "Character portrait illustration for a story.",
    `Character name: ${character.name}.`,
    `Role: ${character.role}.`,
    `Visual appearance (follow exactly): ${appearance}.`,
    tags,
    subjectHint,
    `World mood: ${story.world.tone}, ${story.world.setting}.`,
    "Style: cinematic digital art, rich colors, single character centered, storybook illustration quality.",
    "Composition: vertical 3:4, full character visible, clean background, no text, no watermark, no collage.",
    "Important: depict THIS specific character, not a generic human unless the character is human."
  ]
    .filter(Boolean)
    .join(" ");
}

function getPortraitSubjectHint(character: StoryCharacter) {
  const text = [character.name, character.role, character.appearance, ...character.tags]
    .join(" ")
    .toLowerCase();

  if (/колобок|kolobok/.test(text)) {
    return [
      "Subject type: Russian folklore Kolobok — a round golden-brown baked bread bun with a cheerful face on the sphere,",
      "small stubby limbs, NO human body, NO girl, NO anime character, NOT a person in costume.",
      "Cute fairy-tale food character rolling through a forest."
    ].join(" ");
  }

  if (/лис|fox|волк|wolf|медвед|bear|заяц|hare|rabbit|кот|cat|собак|dog|птиц|bird|животн|animal|звер/.test(text)) {
    return "Subject type: anthropomorphic or realistic animal character. Show the correct species, not a human.";
  }

  if (/робот|robot|голем|golem|дух|spirit|призрак|ghost|монстр|monster|дракон|dragon|гоблин|goblin|эльф|elf|фея|fairy|существо|creature/.test(text)) {
    return "Subject type: fantasy creature or non-human entity. Match the described form exactly, not a human substitute.";
  }

  if (/девочк|мальчик|женщин|мужчин|человек|person|hero|heroine|girl|boy|woman|man|аниме|anime/.test(text)) {
    return "Subject type: human character portrait with accurate face, age, hair and clothing from the description.";
  }

  return "Subject type: match the described physical form literally — if non-human, do not replace with a human.";
}
