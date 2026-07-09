import { GoogleGenAI } from "@google/genai";
import { extractJsonObject } from "@/lib/json";

export type ContentPolicyCategory =
  | "weapons"
  | "adult_content"
  | "drugs"
  | "violence"
  | "hate"
  | "illegal";

export type ContentPolicyBlock = {
  allowed: false;
  code: "CONTENT_POLICY_BLOCKED";
  category: ContentPolicyCategory;
  error: string;
  source: "text" | "vision";
  matches?: string[];
};

export type ContentPolicyAllow = {
  allowed: true;
};

export type ContentPolicyResult = ContentPolicyAllow | ContentPolicyBlock;

type ContentPolicyRule = {
  category: ContentPolicyCategory;
  patterns: RegExp[];
};

function policyPattern(source: string) {
  const body = source
    .replace(/^\\b/, "")
    .replace(/\\b$/g, "")
    .replace(/\\w\*/g, "[\\p{L}\\p{N}_-]*");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_-])${body}(?=$|[^\\p{L}\\p{N}_-])`, "iu");
}

const CATEGORY_LABELS: Record<ContentPolicyCategory, string> = {
  weapons: "оружие и боеприпасы",
  adult_content: "интимные и взрослые товары",
  drugs: "наркотики и запрещённые вещества",
  violence: "насилие и жестокость",
  hate: "экстремистские и оскорбительные материалы",
  illegal: "запрещённые или незаконные товары"
};

const CONTENT_POLICY_RULES: ContentPolicyRule[] = [
  {
    category: "weapons",
    patterns: [
      policyPattern("пистолет\\w*"),
      policyPattern("револьвер\\w*"),
      policyPattern("ружь[её]\\w*"),
      policyPattern("винтовк\\w*"),
      policyPattern("карабин\\w*"),
      policyPattern("автомат\\s+калаш\\w*"),
      policyPattern("ак[\\s-]?47"),
      policyPattern("ар[\\s-]?15"),
      policyPattern("пулем[её]т\\w*"),
      policyPattern("гранатом[её]т\\w*"),
      policyPattern("гранат\\w*"),
      policyPattern("боеприпас\\w*"),
      policyPattern("патрон\\w*"),
      policyPattern("пул[её]\\w*"),
      policyPattern("оружи\\w*"),
      policyPattern("стрелков\\w*"),
      policyPattern("огнестрел\\w*"),
      policyPattern("травмат\\w*"),
      policyPattern("пневмат\\w*[\\s-]?(пистолет|винтовк|ружь)"),
      policyPattern("боев\\w*\\s+нож\\w*"),
      policyPattern("нож[\\s-]?бабочк\\w*"),
      policyPattern("кинжал\\w*"),
      policyPattern("клинок\\w*"),
      policyPattern("меч\\w*"),
      policyPattern("сабл\\w*"),
      policyPattern("арбалет\\w*"),
      policyPattern("нунчак\\w*"),
      policyPattern("брелет\\w*"),
      policyPattern("firearms?"),
      policyPattern("guns?"),
      policyPattern("pistols?"),
      policyPattern("rifles?"),
      policyPattern("shotguns?"),
      policyPattern("ammunition"),
      policyPattern("weapon\\w*")
    ]
  },
  {
    category: "adult_content",
    patterns: [
      policyPattern("18\\s*\\+"),
      policyPattern("nsfw"),
      policyPattern("xxx"),
      policyPattern("порно\\w*"),
      policyPattern("эротик\\w*"),
      policyPattern("секс[\\s-]?(игруш|товар|шоп|магазин|принадлеж)"),
      policyPattern("интимн\\w*"),
      policyPattern("вибратор\\w*"),
      policyPattern("дилдо\\w*"),
      policyPattern("фаллоимит\\w*"),
      policyPattern("мастурб\\w*"),
      policyPattern("вагин\\w*"),
      policyPattern("пенис\\w*"),
      policyPattern("член\\w*\\s+(реалист|силикон)"),
      policyPattern("простат\\w*"),
      policyPattern("анальн\\w*\\s+(пробк|игруш)"),
      policyPattern("бдсм"),
      policyPattern("bdsm"),
      policyPattern("фетиш\\w*"),
      policyPattern("стриптиз\\w*"),
      policyPattern("эскорт\\w*"),
      policyPattern("порнограф\\w*"),
      policyPattern("секс[\\s-]?кукл\\w*"),
      policyPattern("love\\s*doll"),
      policyPattern("sex\\s*toy\\w*"),
      policyPattern("adult\\s*toy\\w*"),
      policyPattern("porn\\w*")
    ]
  },
  {
    category: "drugs",
    patterns: [
      policyPattern("наркотик\\w*"),
      policyPattern("кокаин\\w*"),
      policyPattern("героин\\w*"),
      policyPattern("амфетамин\\w*"),
      policyPattern("метамфетамин\\w*"),
      policyPattern("марихуан\\w*"),
      policyPattern("каннабис\\w*"),
      policyPattern("гашиш\\w*"),
      policyPattern("спайс\\w*"),
      policyPattern("мефедрон\\w*"),
      policyPattern("экстаз\\w*"),
      policyPattern("lsd"),
      policyPattern("mdma"),
      policyPattern("cocaine"),
      policyPattern("heroin"),
      policyPattern("marijuana"),
      policyPattern("cannabis"),
      policyPattern("drug\\s*paraphernalia")
    ]
  },
  {
    category: "violence",
    patterns: [
      policyPattern("расчленен\\w*"),
      policyPattern("кровав\\w*\\s+(сцен|фото|изображ)"),
      policyPattern("пытк\\w*"),
      policyPattern("самоубийств\\w*"),
      policyPattern("террорист\\w*"),
      policyPattern("взрывчат\\w*"),
      policyPattern("детонатор\\w*"),
      policyPattern("gore"),
      policyPattern("self[\\s-]?harm")
    ]
  },
  {
    category: "hate",
    patterns: [
      policyPattern("нацист\\w*"),
      policyPattern("свастик\\w*"),
      policyPattern("фашист\\w*"),
      policyPattern("расист\\w*"),
      policyPattern("ненавист\\w*\\s+к\\s+(евре|мусульм|чернокож|азиат)"),
      policyPattern("nazi\\w*"),
      policyPattern("swastika"),
      policyPattern("kkk")
    ]
  },
  {
    category: "illegal",
    patterns: [
      policyPattern("поддельн\\w*\\s+(документ|паспорт|удостоверен)"),
      policyPattern("фальшив\\w*\\s+(деньг|купюр|паспорт)"),
      policyPattern("отмыв\\w*\\s+денег"),
      policyPattern("краден\\w*"),
      policyPattern("counterfeit")
    ]
  }
];

const USER_FACING_MESSAGES: Record<ContentPolicyCategory, string> = {
  weapons:
    "Генерация изображений с оружием и боеприпасами запрещена политикой AI-провайдера. Загрузите другой товар или измените описание.",
  adult_content:
    "Генерация изображений для интимных и взрослых товаров запрещена политикой AI-провайдера. Загрузите другое фото или измените описание.",
  drugs:
    "Генерация изображений для запрещённых веществ запрещена политикой AI-провайдера.",
  violence:
    "Генерация изображений с насилием или жестокостью запрещена политикой AI-провайдера.",
  hate:
    "Генерация изображений с экстремистским или оскорбительным содержанием запрещена.",
  illegal:
    "Генерация изображений для незаконных товаров запрещена."
};

type VisionModerationResult = {
  allowed: boolean;
  category?: ContentPolicyCategory;
  reason?: string;
  confidence?: "high" | "medium" | "low";
};

function normalizePolicyText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

export function collectContentPolicyText(input: {
  productDescription?: string;
  category?: string;
  sellerWishes?: string;
  editInstructions?: string;
  title?: string;
  brand?: string;
  identifiedProductName?: string;
  benefits?: string[];
  infographicTexts?: string[];
  keywords?: string[];
}): string {
  return [
    input.productDescription,
    input.category,
    input.sellerWishes,
    input.editInstructions,
    input.title,
    input.brand,
    input.identifiedProductName,
    ...(input.benefits ?? []),
    ...(input.infographicTexts ?? []),
    ...(input.keywords ?? [])
  ]
    .map(normalizePolicyText)
    .filter(Boolean)
    .join("\n");
}

function findPatternMatch(text: string, rule: ContentPolicyRule): string | null {
  for (const pattern of rule.patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return match[0].trim();
    }
  }

  return null;
}

export function scanTextForProhibitedContent(text: string): ContentPolicyResult {
  const normalized = normalizePolicyText(text);

  if (!normalized) {
    return { allowed: true };
  }

  for (const rule of CONTENT_POLICY_RULES) {
    const match = findPatternMatch(normalized, rule);

    if (match) {
      return {
        allowed: false,
        code: "CONTENT_POLICY_BLOCKED",
        category: rule.category,
        error: USER_FACING_MESSAGES[rule.category],
        source: "text",
        matches: [match]
      };
    }
  }

  return { allowed: true };
}

function buildVisionModerationPrompt(sellerText: string) {
  return `Ты модератор контента для AI-генерации карточек товаров.
Проанализируй фото товара и текст продавца. Определи, можно ли генерировать изображение через AI-провайдер (NanoBanana/Gemini).

Блокируй только явные нарушения:
- оружие, огнестрельное, пневматическое, боеприпасы, боевые ножи и холодное оружие;
- интимные/секс-игрушки, эротика, порно, 18+ товары;
- наркотики и запрещённые вещества;
- жестокость, кровь, терроризм, взрывчатка;
- экстремистские символы и hate content;
- явно незаконные товары.

Разрешай обычные товары: кухонные ножи, инструменты, детские игрушки, одежду, электронику, косметику, еду.

Текст продавца:
${sellerText || "не указан"}

Верни только JSON без markdown:
{
  "allowed": true,
  "category": null,
  "reason": null,
  "confidence": "high"
}

Если нужно заблокировать:
{
  "allowed": false,
  "category": "weapons|adult_content|drugs|violence|hate|illegal",
  "reason": "кратко по-русски",
  "confidence": "high|medium|low"
}`;
}

function parseVisionModerationResult(text: string): VisionModerationResult | null {
  try {
    const parsed = JSON.parse(extractJsonObject(text)) as VisionModerationResult;

    if (typeof parsed.allowed !== "boolean") {
      return null;
    }

    const category = parsed.category;
    const validCategory =
      category === "weapons" ||
      category === "adult_content" ||
      category === "drugs" ||
      category === "violence" ||
      category === "hate" ||
      category === "illegal"
        ? category
        : undefined;

    const confidence =
      parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "medium";

    return {
      allowed: parsed.allowed,
      category: validCategory,
      reason: parsed.reason ? String(parsed.reason).trim() : undefined,
      confidence
    };
  } catch {
    return null;
  }
}

export async function moderateContentWithVision(input: {
  imageBase64: string;
  imageMimeType: string;
  sellerText: string;
}): Promise<ContentPolicyResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { allowed: true };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_VISION_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: buildVisionModerationPrompt(input.sellerText) },
            {
              inlineData: {
                mimeType: input.imageMimeType,
                data: input.imageBase64
              }
            }
          ]
        }
      ]
    });

    const moderation = parseVisionModerationResult(response.text ?? "");

    if (!moderation || moderation.allowed) {
      return { allowed: true };
    }

    if (moderation.confidence === "low") {
      return { allowed: true };
    }

    const category = moderation.category ?? "illegal";

    return {
      allowed: false,
      code: "CONTENT_POLICY_BLOCKED",
      category,
      error: moderation.reason || USER_FACING_MESSAGES[category],
      source: "vision"
    };
  } catch (error) {
    console.warn(
      "[MarketCard AI] content policy vision check failed:",
      error instanceof Error ? error.message : error
    );
    return { allowed: true };
  }
}

export async function assessGenerationContentPolicy(input: {
  productDescription?: string;
  category?: string;
  sellerWishes?: string;
  editInstructions?: string;
  title?: string;
  brand?: string;
  identifiedProductName?: string;
  benefits?: string[];
  infographicTexts?: string[];
  keywords?: string[];
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<ContentPolicyResult> {
  const sellerText = collectContentPolicyText(input);
  const textResult = scanTextForProhibitedContent(sellerText);

  if (!textResult.allowed) {
    return textResult;
  }

  if (input.imageBase64 && input.imageMimeType) {
    const visionResult = await moderateContentWithVision({
      imageBase64: input.imageBase64,
      imageMimeType: input.imageMimeType,
      sellerText
    });

    if (!visionResult.allowed) {
      return visionResult;
    }
  }

  return { allowed: true };
}

export function getContentPolicyCategoryLabel(category: ContentPolicyCategory) {
  return CATEGORY_LABELS[category];
}
