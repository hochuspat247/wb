import type { GenerateImageInput } from "@/types/product-card";

export type ProductSceneCategory =
  | "water_transport"
  | "pet_product"
  | "beauty"
  | "electronics"
  | "home"
  | "apparel"
  | "automotive"
  | "sport"
  | "kids"
  | "tools"
  | "other";

export type ProductSceneRules = {
  category: ProductSceneCategory;
  environment: string;
  lighting: string;
  mood: string;
  mustInclude: string[];
  mustAvoid: string[];
  usefulProps: string[];
  compositionHint: string;
};

type SceneInput = {
  productDescription?: string;
  category?: string;
  title?: string;
  seriesCardType?: string;
  seriesCardGoal?: string;
  seriesCardVisualIdea?: string;
};

type CardTypeRules = {
  role: string;
  goal: string;
  environmentAngle: string;
  composition: string;
  textDensity: "low" | "medium" | "high";
};

const CATEGORY_SCENE_RULES: Record<ProductSceneCategory, ProductSceneRules> = {
  water_transport: {
    category: "water_transport",
    environment: "real waterfront context: calm water, dock, marina, lake, river shore, mooring area, clean open air",
    lighting: "soft daylight or warm sunset light with believable water reflections",
    mood: "premium leisure, family trip, comfort, calm movement on water, trust",
    mustInclude: ["water", "dock or marina", "natural open-air light", "space around the vessel"],
    mustAvoid: [
      "abstract interior",
      "marble wall",
      "glossy showroom floor",
      "generic luxury studio",
      "space background",
      "neon cyber effects"
    ],
    usefulProps: ["subtle water highlights", "dock edge", "shoreline", "soft sky", "clean feature callouts"],
    compositionHint:
      "show the boat as the main object on water or near a dock; the environment must immediately explain that this is water transport"
  },
  pet_product: {
    category: "pet_product",
    environment: "clean home setting for pet care: litter area, pet corner, soft interior, tidy floor",
    lighting: "soft natural home light, bright clean atmosphere",
    mood: "cleanliness, care, safety, home comfort",
    mustInclude: ["home context", "clean pet-use area", "clear purpose"],
    mustAvoid: ["dirty background", "aggressive neon", "medical sterility", "random decorative texture"],
    usefulProps: ["pet-use area", "cleaning scoop", "tidy surface", "simple hygiene icons"],
    compositionHint: "show the product in a believable pet-care scenario, not as an abstract object on a random platform"
  },
  beauty: {
    category: "beauty",
    environment: "beauty context: vanity table, bathroom shelf, clean studio surface, product texture macro",
    lighting: "soft diffused light with careful highlights",
    mood: "care, cleanliness, premium feel, trust",
    mustInclude: ["beauty context", "clean surface", "care-oriented visual cue"],
    mustAvoid: ["dirty surfaces", "medical claims", "aggressive effects", "random icons"],
    usefulProps: ["drops", "cream texture", "mirror", "soft cards"],
    compositionHint: "focus on packaging, texture, and a clean care ritual"
  },
  electronics: {
    category: "electronics",
    environment: "modern tech context: desk setup, clean digital surface, studio tech background, lifestyle workspace",
    lighting: "controlled contrast, soft reflections, clean technical highlights",
    mood: "precision, reliability, modern function",
    mustInclude: ["tech context", "clean lines", "clear focus on device"],
    mustAvoid: ["chaotic neon", "magic particles", "overloaded HUD", "too much tiny text"],
    usefulProps: ["small spec icons", "device mockup angle", "schematic line accents"],
    compositionHint: "make the device the hero; use tech cues only if they clarify features"
  },
  home: {
    category: "home",
    environment: "relevant home interior: kitchen, bedroom, bathroom, living room, storage area, or tabletop lifestyle scene",
    lighting: "natural window light or soft warm interior light",
    mood: "comfort, order, everyday usefulness",
    mustInclude: ["home-use context", "clean interior", "visible use scenario"],
    mustAvoid: ["random luxury stage", "unrelated outdoor scene", "overdecorated background"],
    usefulProps: ["shelf", "tabletop", "storage area", "soft shadows"],
    compositionHint: "place the product where it would naturally be used or stored"
  },
  apparel: {
    category: "apparel",
    environment: "fashion or lifestyle context: model, fabric texture, dressing area, editorial background",
    lighting: "clean editorial light with visible texture and fit",
    mood: "style, comfort, fit, tactile quality",
    mustInclude: ["fashion context", "fabric or fit cue", "clear product silhouette"],
    mustAvoid: ["random product pedestal", "unrelated tech background", "overloaded text"],
    usefulProps: ["fabric macro", "hanger", "model crop", "color swatches"],
    compositionHint: "show fit, material, and styling rather than a generic object card"
  },
  automotive: {
    category: "automotive",
    environment: "garage, vehicle interior, road, workshop, or clean technical car-care scene",
    lighting: "realistic workshop or daylight with controlled reflections",
    mood: "practicality, durability, technical trust",
    mustInclude: ["vehicle context", "technical setting", "clear function"],
    mustAvoid: ["random home decor", "beauty studio", "magic glow"],
    usefulProps: ["dashboard", "garage surface", "tool line", "road texture"],
    compositionHint: "connect the product to the vehicle part or use case"
  },
  sport: {
    category: "sport",
    environment: "gym, training area, outdoor sport context, active lifestyle scene",
    lighting: "energetic but clean commercial light",
    mood: "movement, endurance, function",
    mustInclude: ["training context", "clear use scenario", "active visual cue"],
    mustAvoid: ["random luxury interior", "unrelated office scene", "excessive effects"],
    usefulProps: ["mat", "gym floor", "outdoor trail", "water bottle"],
    compositionHint: "show the product as part of training or active use"
  },
  kids: {
    category: "kids",
    environment: "safe child room, play area, soft home setting, family-oriented scene",
    lighting: "soft bright natural light",
    mood: "safety, warmth, care, play",
    mustInclude: ["child-safe context", "soft light", "clear age/use cue"],
    mustAvoid: ["harsh neon", "unsafe props", "medical promises"],
    usefulProps: ["play mat", "child room elements", "soft shapes"],
    compositionHint: "keep the scene warm, safe, and uncluttered"
  },
  tools: {
    category: "tools",
    environment: "workshop, garage, repair bench, technical workspace, construction context",
    lighting: "clear practical light with visible material detail",
    mood: "durability, control, utility",
    mustInclude: ["work context", "functional surface", "clear tool purpose"],
    mustAvoid: ["beauty setup", "random premium marble", "soft gift scene"],
    usefulProps: ["workbench", "measuring marks", "technical labels", "material close-up"],
    compositionHint: "show what task the product helps solve"
  },
  other: {
    category: "other",
    environment: "product-specific lifestyle or use-case environment inferred from the product description",
    lighting: "clean commercial light chosen for the product material and use case",
    mood: "trust, clarity, premium but realistic presentation",
    mustInclude: ["context relevant to product use", "clear main product", "clean layout"],
    mustAvoid: ["random abstract luxury background", "generic showroom if unrelated", "decorative clutter"],
    usefulProps: ["only props that explain use, scale, material, or benefit"],
    compositionHint: "infer where the product is actually used before choosing the background"
  }
};

const CATEGORY_KEYWORDS: Record<ProductSceneCategory, string[]> = {
  water_transport: [
    "boat",
    "yacht",
    "marine",
    "watercraft",
    "vessel",
    "\u043a\u0430\u0442\u0435\u0440",
    "\u043b\u043e\u0434\u043a",
    "\u044f\u0445\u0442",
    "\u0441\u0443\u0434\u043d",
    "\u0432\u043e\u0434\u043d",
    "\u043c\u0430\u0440\u0438\u043d",
    "\u043f\u0440\u0438\u0447\u0430\u043b",
    "\u043f\u0440\u043e\u0433\u0443\u043b\u043e\u0447"
  ],
  pet_product: ["pet", "cat", "dog", "litter", "\u043a\u043e\u0448", "\u0441\u043e\u0431\u0430\u043a", "\u043f\u0438\u0442\u043e\u043c", "\u043b\u043e\u0442\u043e\u043a", "\u043d\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b"],
  beauty: ["beauty", "cosmetic", "cream", "serum", "\u043a\u043e\u0441\u043c\u0435\u0442", "\u043a\u0440\u0435\u043c", "\u0441\u044b\u0432\u043e\u0440\u043e\u0442", "\u0443\u0445\u043e\u0434", "\u0448\u0430\u043c\u043f\u0443\u043d"],
  electronics: ["electronics", "headphone", "charger", "cable", "gadget", "\u043d\u0430\u0443\u0448", "\u0437\u0430\u0440\u044f\u0434", "\u043a\u0430\u0431\u0435\u043b", "\u0433\u0430\u0434\u0436\u0435\u0442", "\u0441\u043c\u0430\u0440\u0442"],
  home: ["home", "kitchen", "bathroom", "storage", "\u0434\u043e\u043c", "\u043a\u0443\u0445\u043d", "\u0432\u0430\u043d\u043d", "\u0438\u043d\u0442\u0435\u0440\u044c\u0435\u0440", "\u0445\u0440\u0430\u043d\u0435\u043d"],
  apparel: ["apparel", "clothes", "fashion", "shirt", "dress", "\u043e\u0434\u0435\u0436", "\u043f\u043b\u0430\u0442", "\u0444\u0443\u0442\u0431\u043e\u043b", "\u043a\u0440\u043e\u0441\u0441", "\u043e\u0431\u0443\u0432"],
  automotive: ["auto", "car", "vehicle", "garage", "\u0430\u0432\u0442\u043e", "\u043c\u0430\u0448\u0438\u043d", "\u0433\u0430\u0440\u0430\u0436", "\u0434\u043e\u0440\u043e\u0433"],
  sport: ["sport", "fitness", "gym", "training", "\u0441\u043f\u043e\u0440\u0442", "\u0444\u0438\u0442\u043d\u0435\u0441", "\u0442\u0440\u0435\u043d\u0438\u0440", "\u0437\u0430\u043b"],
  kids: ["kids", "baby", "child", "toy", "\u0434\u0435\u0442\u0441\u043a", "\u0440\u0435\u0431\u0435\u043d", "\u0440\u0435\u0431\u0451\u043d", "\u0438\u0433\u0440\u0443\u0448"],
  tools: ["tool", "workshop", "repair", "instrument", "\u0438\u043d\u0441\u0442\u0440\u0443\u043c", "\u043c\u0430\u0441\u0442\u0435\u0440", "\u0440\u0435\u043c\u043e\u043d\u0442", "\u0433\u0430\u0440\u0430\u0436"],
  other: []
};

const CARD_TYPE_RULES: Record<string, CardTypeRules> = {
  hero: {
    role: "hero cover",
    goal: "make the product immediately understandable and desirable",
    environmentAngle: "strongest usage scene, broad context, emotional product promise",
    composition: "large product, strong headline, 2-3 clear benefit callouts",
    textDensity: "medium"
  },
  benefits: {
    role: "benefits card",
    goal: "explain the main product advantages without repeating the hero cover",
    environmentAngle: "context that visually proves the benefits",
    composition: "product plus clear benefit cards, no crowded collage",
    textDensity: "medium"
  },
  features: {
    role: "features/specs card",
    goal: "make important properties easy to compare",
    environmentAngle: "clean product-bound background with enough space for specs",
    composition: "product on one side, structured feature block on the other side",
    textDensity: "high"
  },
  key_specs: {
    role: "key specifications card",
    goal: "surface the most important technical parameters",
    environmentAngle: "technical but still product-relevant setting",
    composition: "large product, numeric/spec blocks, clean grid",
    textDensity: "high"
  },
  dimensions: {
    role: "dimensions card",
    goal: "show size, proportions, and practical scale",
    environmentAngle: "environment that helps understand scale",
    composition: "product with measurement lines and readable labels",
    textDensity: "high"
  },
  how_to_use: {
    role: "usage card",
    goal: "show how the product is used",
    environmentAngle: "real use scenario, not a decorative background",
    composition: "step-like visual or product-in-action scene",
    textDensity: "medium"
  },
  use_cases: {
    role: "use-cases card",
    goal: "show the main scenarios where the product is useful",
    environmentAngle: "specific lifestyle/use scene",
    composition: "one main scene with 2-3 supporting use callouts",
    textDensity: "medium"
  },
  safety: {
    role: "trust/safety card",
    goal: "build trust without fake certificates or guarantees",
    environmentAngle: "calm, clean, believable setting",
    composition: "restrained badges, clear product, factual copy",
    textDensity: "low"
  },
  package: {
    role: "package contents card",
    goal: "show what is included",
    environmentAngle: "organized unboxing or layout scene relevant to the product",
    composition: "main product plus included items arranged clearly",
    textDensity: "medium"
  },
  final_cta: {
    role: "final gallery card",
    goal: "close the series with a calm final argument",
    environmentAngle: "polished product-relevant scene, no aggressive purchase UI",
    composition: "clean final visual with short summary benefits",
    textDensity: "low"
  }
};

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function combinedText(input: SceneInput) {
  return [input.productDescription, input.category, input.title, input.seriesCardGoal, input.seriesCardVisualIdea]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function detectProductSceneCategory(input: SceneInput): ProductSceneCategory {
  const text = combinedText(input);

  for (const category of Object.keys(CATEGORY_KEYWORDS) as ProductSceneCategory[]) {
    if (category === "other") continue;
    if (CATEGORY_KEYWORDS[category].some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

export function getCategorySceneRules(category: ProductSceneCategory): ProductSceneRules {
  return CATEGORY_SCENE_RULES[category] ?? CATEGORY_SCENE_RULES.other;
}

export function getCardTypeRules(type?: string): CardTypeRules {
  return CARD_TYPE_RULES[clean(type)] ?? {
    role: "product card",
    goal: "reveal one specific side of the product",
    environmentAngle: "background selected from the product category and the card meaning",
    composition: "clear product-first composition with short readable text blocks",
    textDensity: "medium"
  };
}

export function buildProductContext(input: GenerateImageInput) {
  const detectedCategory = detectProductSceneCategory(input);
  const sceneRules = getCategorySceneRules(detectedCategory);
  const cardRules = getCardTypeRules(input.seriesCardType);

  return {
    detectedCategory,
    sceneRules,
    cardRules
  };
}

export function buildProductEnvironmentPromptBlock(input: GenerateImageInput): string {
  const { detectedCategory, sceneRules, cardRules } = buildProductContext(input);

  return `
PRODUCT-BOUND ENVIRONMENT:
Before composing the image, infer the product environment from the product type, category, use case, material, target buyer, and this card's role.
Detected environment family: ${detectedCategory}
Card role (internal only, never print on image): ${cardRules.role}
Card goal (internal only, never quote as headline): ${clean(input.seriesCardGoal) || cardRules.goal}
Card-specific visual angle: ${clean(input.seriesCardVisualIdea) || cardRules.environmentAngle}

Required environment:
- ${sceneRules.environment}
- Lighting: ${sceneRules.lighting}
- Mood: ${sceneRules.mood}
- Composition: ${sceneRules.compositionHint}
- Card composition: ${cardRules.composition}

The background must be built from the product itself, not from a generic premium template.
It must look like the natural commercial environment where this product is used, inspected, stored, or enjoyed.

Must include:
${sceneRules.mustInclude.map((item) => `- ${item}`).join("\n")}

Useful supporting visual props:
${sceneRules.usefulProps.map((item) => `- ${item}`).join("\n")}

Must avoid:
${sceneRules.mustAvoid.map((item) => `- ${item}`).join("\n")}
- generic random premium background if it is not connected to the product
- decorative textures that do not explain the product
- using the same abstract scene for every gallery card
`.trim();
}

export function buildSeriesPlanPrompt(input: GenerateImageInput): string {
  const { sceneRules, cardRules } = buildProductContext(input);

  return `
SERIES PLANNING RULE:
This card is part of a sequence. Keep one visual system, but do not repeat the same background or composition.
Each card must reveal a new product angle:
- role: ${cardRules.role}
- goal: ${clean(input.seriesCardGoal) || cardRules.goal}
- environment angle: ${clean(input.seriesCardVisualIdea) || cardRules.environmentAngle}
- relevant environment: ${sceneRules.environment}
`.trim();
}
