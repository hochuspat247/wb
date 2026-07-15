import type { CreateStoryInput, StoryCharacter, StoryLanguage, StoryProject } from "@/types/storystudio";
import { STORY_GENRES, STORY_LANGUAGES } from "@/lib/storystudio/constants";
import { formatCharactersForPrompt, formatRelationsForPrompt } from "@/lib/storystudio/relations";

function genreLabels(genres: string[]) {
  return genres
    .map((g) => STORY_GENRES.find((item) => item.id === g)?.label ?? g)
    .join(", ");
}

function languageLabel(language: StoryLanguage) {
  return STORY_LANGUAGES.find((item) => item.id === language)?.label ?? language;
}

function storyLanguageInstruction(language: StoryLanguage) {
  const label = languageLabel(language);
  return `Язык произведения: ${label}. Все тексты (синопсис, хук, мир, персонажи, главы) пиши на ${label}.`;
}

function premiumModeLine(premiumMode: boolean) {
  return premiumMode
    ? [
        "Режим Premium: сильнее держи сюжетную связность, глубже прорабатывай мир и героев,",
        "пиши более длинные и цельные сцены; допускаются взрослые темы 18+, откровенные сцены и грубая лексика,",
        "если это органично для жанра."
      ].join(" ")
    : "Обычный режим: без откровенного 18+ контента. Можно быстро собрать идею, персонажей, мир и первые главы.";
}

export function buildStoryFoundationPrompt(input: CreateStoryInput) {
  const premium = premiumModeLine(Boolean(input.premiumMode));

  return `Ты — литературный редактор и сценарист мирового уровня. Создай основу художественного произведения.

Заголовок: ${input.title}
Основная идея: ${input.premise}
Жанры: ${genreLabels(input.genres)}
${storyLanguageInstruction(input.language)}
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
  "content": "полный текст главы ${story.premiumMode ? "900-1400" : "700-1100"} слов, художественная проза на языке: ${languageLabel(story.language)}"
}`;
}

export function buildStoryAnalysisPrompt(story: StoryProject, focus?: string) {
  const chaptersText = story.chapters
    .slice(0, 10)
    .map((c) => {
      const body = c.content?.trim() || c.summary || "";
      return `### Глава ${c.number}. ${c.title}\nКратко: ${c.summary || "—"}\nТекст:\n${body.slice(0, 2200)}`;
    })
    .join("\n\n");

  const focusLine = focus?.trim()
    ? `Дополнительный акцент автора: ${focus.trim()}`
    : "";

  return `Ты — литературный редактор. Проанализируй УЖЕ НАПИСАННУЮ историю и скажи, что с ней делать дальше.

Задача:
1) коротко оцени то, что уже есть (основа, персонажи, главы);
2) укажи слабые места и что стоит доработать;
3) предложи, что можно ДОБАВИТЬ дальше (сцены, конфликты, персонажные линии, детали мира, следующие главы).

Не проси автора заново описать историю. Не давай общих советов «пиши лучше» — опирайся на конкретные детали ниже.
${storyLanguageInstruction(story.language)}
${focusLine}

Название: ${story.title}
Хук: ${story.hook || "—"}
Синопсис: ${story.synopsis || "—"}
Жанры: ${story.genres.join(", ") || "—"}
Темы: ${story.themes.join(", ") || "—"}
Мир: ${story.world.setting || "—"}; тон: ${story.world.tone || "—"}; эпоха: ${story.world.era || "—"}
Персонажи:
${formatCharactersForPrompt(story)}
Связи:
${formatRelationsForPrompt(story)}
План: ${story.outline.length ? story.outline.join(" → ") : "плана нет"}

Главы (${story.chapters.length}):
${chaptersText || "Глав ещё нет — оцени основу, персонажей и план; предложи, с чего начать первую главу и что добавить."}

Верни ТОЛЬКО JSON такого вида:
{
  "summary": "2–4 предложения: что уже получается и куда двигаться",
  "remarks": [
    {
      "severity": "critical|attention|good",
      "title": "короткий заголовок",
      "detail": "конкретное наблюдение по этой истории",
      "suggestion": "что доработать или добавить; для good можно пустую строку"
    }
  ]
}

Обязательно 6–10 замечаний.
Смешай severity:
- good — что уже работает;
- attention — что улучшить;
- critical — что мешает цельности или дальшему развитию.
Хотя бы 2 замечания severity=attention или critical должны быть про то, что можно ДОБАВИТЬ.`;
}

export function buildStoryMediaPrompt(input: {
  kind: "character" | "world" | "chapter" | "fact";
  title: string;
  prompt: string;
  story: StoryProject;
  character?: StoryCharacter;
}) {
  const { kind, title, prompt, story, character } = input;
  const base = [
    "Cinematic story illustration, high quality digital art, rich atmosphere, no text, no watermark.",
    `Story: ${story.title}.`,
    `World: ${story.world.setting}, tone ${story.world.tone}, era ${story.world.era}.`,
    `User request: ${prompt.trim() || title}.`
  ];

  if (kind === "character" && character) {
    return [
      ...base,
      `Character portrait / scene of ${character.name}, role: ${character.role}.`,
      `Appearance: ${character.appearance}.`,
      "Composition: vertical 3:4, character focused."
    ].join(" ");
  }

  if (kind === "chapter") {
    return [
      ...base,
      `Chapter mood illustration titled "${title}".`,
      "Composition: cinematic wide scene, atmospheric lighting, storybook quality."
    ].join(" ");
  }

  if (kind === "fact") {
    return [
      ...base,
      `Visual for world fact / object / rule titled "${title}".`,
      "Composition: iconic symbolic illustration of this story detail."
    ].join(" ");
  }

  return [
    ...base,
    `World / location illustration titled "${title}".`,
    "Composition: establishing shot of place or atmosphere from the setting."
  ].join(" ");
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
