import { generateNanoBananaExpertReferenceEdit } from "@/lib/ai/nanobananaExpert";
import { createImageGenerationError } from "@/lib/ai/imageGenerationErrors";
import type { KvartovidListingInput, KvartovidPropertyType } from "@/types/kvartovid";
import type { GenerateImageResult } from "@/types/product-card";

const BAD_COVER_TITLE_PATTERN =
  /\b(машин|пылесос|товар|корзин|артикул|sku|гаджет|бытов\w*\s+техник)\b/i;

const DEFAULT_BANNER_CTA = "УЗНАТЬ ПОДРОБНЕЕ";
const DEFAULT_RIBBON_BADGE = "ГОТОВА К ПРОЖИВАНИЮ\nЗАЕЗЖАЙ И ЖИВИ";

const DEFAULT_FOOTER_ITEMS = [
  "Качественный дом",
  "Спокойный район",
  "Развитая инфраструктура"
] as const;

const DEFAULT_SPEC_LABELS = [
  "Много естественного света",
  "Продуманный интерьер",
  "Удобное расположение",
  "Готова к комфортной жизни"
] as const;

export type KvartovidBannerSpec = {
  value: string;
  label: string;
};

export type KvartovidCoverBannerCopy = {
  headline: string;
  locationBadge: string;
  specs: [KvartovidBannerSpec, KvartovidBannerSpec, KvartovidBannerSpec, KvartovidBannerSpec];
  ribbonBadge: string;
  footerItems: [string, string, string];
  cta: string;
};

type RawCoverBanner = {
  headline?: string;
  locationBadge?: string;
  specs?: Array<{ value?: string; label?: string }>;
  ribbonBadge?: string;
  footerItems?: string[];
  cta?: string;
  advantages?: string[];
};

function asBannerLines(value: string, maxLines = 2, maxLineLength = 36): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const explicitLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);

  if (explicitLines.length >= 2) {
    return explicitLines.join("\n");
  }

  if (normalized.length <= maxLineLength) {
    return normalized.toUpperCase();
  }

  const words = normalized.split(" ");
  let firstLine = "";

  for (const word of words) {
    const next = firstLine ? `${firstLine} ${word}` : word;
    if (next.length > maxLineLength) break;
    firstLine = next;
  }

  const remainder = words.slice(firstLine.split(" ").length).join(" ").trim();
  if (!remainder) {
    return firstLine.toUpperCase();
  }

  return `${firstLine.toUpperCase()}\n${remainder.toUpperCase()}`;
}

function formatRoomsValue(rooms: string, propertyType: KvartovidPropertyType): string {
  if (propertyType === "studio") return "Студия";
  if (propertyType === "room") return "Комната";
  if (propertyType === "house") return "Дом";

  const count = Number.parseInt(rooms, 10);
  if (!Number.isFinite(count)) return `${rooms} комн.`;
  if (count === 1) return "1 комната";
  if (count >= 2 && count <= 4) return `${count} комнаты`;
  return `${count} комнат`;
}

function buildDefaultHeadline(input: KvartovidListingInput): string {
  if (input.propertyType === "studio") return "СТИЛЬНАЯ\nСТУДИЯ";
  if (input.propertyType === "room") return "УЮТНАЯ\nКОМНАТА";
  if (input.propertyType === "house") return "СОВРЕМЕННЫЙ\nДОМ";

  const count = Number.parseInt(input.rooms, 10);
  if (Number.isFinite(count) && count > 0) {
    const roomLabel =
      count === 1 ? "1-КОМНАТНАЯ" : count >= 2 && count <= 4 ? `${count}-КОМНАТНАЯ` : `${count}-КОМНАТНАЯ`;
    return `СВЕТЛАЯ ${roomLabel}\nКВАРТИРА`;
  }

  return "СВЕТЛАЯ И УЮТНАЯ\nКВАРТИРА";
}

function buildLocationBadge(input: KvartovidListingInput, raw?: string): string {
  const custom = raw?.trim();
  if (custom) return custom.toUpperCase();

  if (input.district) {
    return input.district.toUpperCase();
  }

  if (input.metro) {
    return `РЯДОМ ${input.metro.toUpperCase()}`;
  }

  return input.city.toUpperCase();
}

function normalizeSpec(
  raw: { value?: string; label?: string } | undefined,
  fallbackValue: string,
  fallbackLabel: string
): KvartovidBannerSpec {
  const value = raw?.value?.trim() || fallbackValue;
  const label = raw?.label?.trim() || fallbackLabel;
  return { value, label };
}

export function buildKvartovidCoverHeadline(
  input: KvartovidListingInput,
  aiTitle: string,
  platformAvitoTitle?: string
): string {
  const candidates = [platformAvitoTitle, aiTitle].map((value) => value?.trim()).filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate.length >= 8 && candidate.length <= 75 && !BAD_COVER_TITLE_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  return buildDefaultHeadline(input).replace(/\n/g, " ");
}

export function buildCoverBannerCopy(
  input: KvartovidListingInput,
  raw: RawCoverBanner | undefined,
  title: string,
  avitoTitle: string | undefined,
  advantages: string[]
): KvartovidCoverBannerCopy {
  const fallbackHeadline = buildDefaultHeadline(input);
  const headlineSource = raw?.headline?.trim() || avitoTitle || title;
  const headline = asBannerLines(headlineSource) || fallbackHeadline;

  const rawSpecs = raw?.specs ?? [];
  const metroSpecValue = input.metro ? `Метро ${input.metro}` : input.district ? input.district : input.city;
  const metroSpecLabel = input.metro ? "Удобное расположение" : "Расположение";

  const specs: [KvartovidBannerSpec, KvartovidBannerSpec, KvartovidBannerSpec, KvartovidBannerSpec] = [
    normalizeSpec(rawSpecs[0], `${input.area} м²`, "Общая площадь"),
    normalizeSpec(rawSpecs[1], formatRoomsValue(input.rooms, input.propertyType), "Пространство и комфорт"),
    normalizeSpec(
      rawSpecs[2],
      advantages[0] || raw?.advantages?.[0] || DEFAULT_SPEC_LABELS[0],
      rawSpecs[2]?.label?.trim() || DEFAULT_SPEC_LABELS[1]
    ),
    normalizeSpec(rawSpecs[3], metroSpecValue, rawSpecs[3]?.label?.trim() || metroSpecLabel)
  ];

  specs[0] = { value: `${input.area} м²`, label: "Общая площадь" };
  specs[1] = {
    value: formatRoomsValue(input.rooms, input.propertyType),
    label: "Пространство и комфорт"
  };

  const footerSource = (raw?.footerItems ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  while (footerSource.length < 3) {
    footerSource.push(DEFAULT_FOOTER_ITEMS[footerSource.length] ?? DEFAULT_FOOTER_ITEMS[2]);
  }

  return {
    headline,
    locationBadge: buildLocationBadge(input, raw?.locationBadge),
    specs,
    ribbonBadge: asBannerLines(raw?.ribbonBadge?.trim() || DEFAULT_RIBBON_BADGE, 2, 22),
    footerItems: footerSource.slice(0, 3) as [string, string, string],
    cta: (raw?.cta?.trim() || DEFAULT_BANNER_CTA).toUpperCase()
  };
}

export function pickSecondaryPhotoIndexes(
  mainPhotoIndex: number,
  photoCount: number,
  requested?: number[]
): number[] {
  const validRequested = (requested ?? [])
    .map((index) => Math.floor(index))
    .filter((index) => index >= 0 && index < photoCount && index !== mainPhotoIndex);

  const uniqueRequested = [...new Set(validRequested)].slice(0, 3);
  if (uniqueRequested.length >= 2 || (photoCount <= 2 && uniqueRequested.length > 0)) {
    return uniqueRequested;
  }

  const picked: number[] = [];
  for (let index = 0; index < photoCount && picked.length < 3; index += 1) {
    if (index === mainPhotoIndex) continue;
    picked.push(index);
  }

  return picked;
}

export function buildKvartovidCoverImagePrompt(
  copy: KvartovidCoverBannerCopy,
  photoCount: number,
  mainPhotoIndex: number,
  secondaryPhotoIndexes: number[]
): string {
  const secondaryLines =
    secondaryPhotoIndexes.length > 0
      ? secondaryPhotoIndexes
          .map(
            (index, order) =>
              `- Референс ${order + 2} (фото ${index + 1} из ${photoCount}): дополнительная фотография в нижней фотогалерее баннера.`
          )
          .join("\n")
      : "- Дополнительные фото отсутствуют: используй главное фото и сохрани структуру баннера.";

  const [spec1, spec2, spec3, spec4] = copy.specs;
  const [footer1, footer2, footer3] = copy.footerItems;

  return `
На основе всех загруженных фотографий одной и той же квартиры создай профессиональный рекламный баннер для объявления о недвижимости — как креатив премиального агентства недвижимости.

Используй реальные фотографии квартиры как визуальные референсы и сохрани узнаваемость объекта.

КРИТИЧЕСКИ ВАЖНО:
Не создавай совершенно новую квартиру.
Не заменяй реальный интерьер другим интерьером.
Не изменяй количество и расположение окон.
Не изменяй архитектуру помещений.
Не добавляй двери, балконы, камин, панорамные окна, мебель, декор или вид из окна, которых нет на исходных фотографиях.
Не объединяй несовместимые элементы разных комнат в одну вымышленную комнату.
Это НЕ товарная карточка маркетплейса.
Допустима только аккуратная профессиональная обработка: свет, экспозиция, резкость, цветокоррекция, лёгкая ретушь.

Создай полноценный дизайнерский рекламный баннер, а не просто коллаж.

РАСПРЕДЕЛЕНИЕ РЕФЕРЕНС-ФОТО:
- Референс 1 (фото ${mainPhotoIndex + 1} из ${photoCount}): главная крупная фотография в верхней правой части баннера.
${secondaryLines}

КОМПОЗИЦИЯ (как у премиального агентства):
Широкий горизонтальный баннер 3:2.
Слева ~30–35% — светлый молочный информационный блок на бежевом фоне.
Справа ~65–70% — визуальная часть с фотографиями квартиры.
Вверху справа — одна большая главная фотография интерьера.
Внизу справа — 2–3 дополнительные фотографии в виде архитектурной галереи с тонкими белыми разделителями и аккуратными диагональными срезами между кадрами.
В самом низу баннера на всю ширину — тёмно-коричневая footer-полоска с 3 пунктами.

ЛЕВЫЙ ИНФОРМАЦИОННЫЙ БЛОК:
1. Крупный заголовок в 1–2 строки, графитовый текст (точно, без изменений):
«${copy.headline.replace(/\n/g, "\n")}»

2. Под заголовком — тёмно-коричневая pill-плашка с маленькой иконкой геолокации слева (точно, без изменений):
«${copy.locationBadge}»

3. Четыре строки характеристик с минималистичными линейными иконками слева. Формат: крупное значение + короткая подпись снизу (точно, без изменений):
   • «${spec1.value}» — «${spec1.label}»
   • «${spec2.value}» — «${spec2.label}»
   • «${spec3.value}» — «${spec3.label}»
   • «${spec4.value}» — «${spec4.label}»

4. Внизу левого блока — крупная коричневая кнопка с белым текстом (точно, без изменений):
«${copy.cta}»

ГЛАВНОЕ ФОТО (верхняя правая часть):
Поверх главной фотографии в правом верхнем углу — золотая diagonal ribbon / лента-бейдж premium-стиля (точно, без изменений):
«${copy.ribbonBadge.replace(/\n/g, "\n")}»
Лента должна выглядеть как элегантная золотистая наклейка агентства недвижимости, не как дешёвый стикер.

НИЖНЯЯ FOOTER-ПОЛОСА (на всю ширину баннера):
Тёмно-коричневая горизонтальная полоска с 3 пунктами и маленькими линейными иконками (точно, без изменений):
«${footer1}» | «${footer2}» | «${footer3}»

СТИЛЬ ДИЗАЙНА:
Premium real estate advertising.
Современная европейская рекламная стилистика.
Editorial design, luxury real estate brochure.
Светлый молочный фон, тёплые бежевые оттенки, графитовый текст, золотисто-коричневые акценты.
Элегантная современная типографика, много воздуха, чёткая модульная сетка.
Дорогой, спокойный, уверенный внешний вид — как на рекламном креативе стоимостью премиального дизайн-проекта.

Не использовать: кислотные цвета, неон, дешёвые градиенты, 3D-текст, инфобизнес-стилистику, маркетплейс-карточки, логотипы Авито/Циан/Домклик, водяные знаки, ценники.

ТЕКСТ:
Весь текст — точно на русском языке.
Не менять формулировки из блоков выше.
Не искажать слова и не добавлять текст, которого нет в инструкции.
Не добавлять цену, телефон, QR-код, случайные цифры.

Приоритет читаемости текста:
1. Заголовок «${copy.headline.replace(/\n/g, " / ")}»
2. Плашка «${copy.locationBadge}»
3. Кнопка «${copy.cta}»
4. Золотая лента «${copy.ribbonBadge.replace(/\n/g, " / ")}»

ФОТОГРАФИИ:
Сохраняй исходную мебель, окна, планировку и стилистику.
Согласуй все кадры по температуре света, контрасту и экспозиции.

РЕЗУЛЬТАТ:
Фотореалистичный профессиональный рекламный баннер недвижимости.
Соотношение сторон 3:2.
Без водяных знаков и посторонних логотипов.
Только финальное изображение. Без рамки мокапа. Без пояснений.
`.trim();
}

export async function generateKvartovidCoverImage(
  input: KvartovidListingInput,
  copy: KvartovidCoverBannerCopy,
  mainPhotoIndex: number,
  secondaryPhotoIndexes: number[]
): Promise<GenerateImageResult> {
  const mainPhoto = input.photos[mainPhotoIndex];
  if (!mainPhoto) {
    return createImageGenerationError(
      "NanoBanana Expert",
      "",
      "Не выбрано фото для обложки.",
      new Date().toISOString()
    );
  }

  const prompt = buildKvartovidCoverImagePrompt(
    copy,
    input.photos.length,
    mainPhotoIndex,
    secondaryPhotoIndexes
  );

  const additionalReferenceImages = secondaryPhotoIndexes
    .map((index) => input.photos[index])
    .filter(Boolean)
    .map((photo) => ({ base64: photo.base64, mimeType: photo.mimeType }));

  const infographicTexts = [
    copy.headline.replace(/\n/g, " "),
    copy.locationBadge,
    ...copy.specs.flatMap((spec) => [spec.value, spec.label]),
    copy.ribbonBadge.replace(/\n/g, " "),
    ...copy.footerItems,
    copy.cta
  ];

  return generateNanoBananaExpertReferenceEdit({
    prompt,
    imageBase64: mainPhoto.base64,
    imageMimeType: mainPhoto.mimeType,
    additionalReferenceImages,
    aspectRatio: "3:2",
    resolution: "1k",
    outputFormat: "png",
    model: "nb2",
    contentPolicyFields: {
      productDescription: prompt,
      category: "Недвижимость",
      title: copy.headline.replace(/\n/g, " "),
      benefits: copy.footerItems,
      infographicTexts
    }
  });
}
