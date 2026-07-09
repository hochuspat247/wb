import { toPng } from "html-to-image";
import { BRAND } from "@/lib/branding";
import type { MarketplacePlatform } from "@/types/marketplace";
import type { ProductCardResult } from "@/types/product-card";

export function downloadJson(card: ProductCardResult) {
  const exportPayload = {
    ...card,
    platform: card.platform ?? card.marketplaceText?.platform,
    textMode: card.textMode ?? card.marketplaceText?.mode,
    marketplaceText: card.marketplaceText,
    platformSpecific: card.marketplaceText?.platformSpecific,
    moderationWarnings: card.marketplaceText?.moderationWarnings ?? [],
    improvementTips: card.marketplaceText?.improvementTips ?? [],
    exportChecklist: card.marketplaceText?.exportChecklist ?? []
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `marketcard-${card.id}.json`);
  URL.revokeObjectURL(url);
}

export function formatCardText(card: ProductCardResult) {
  const mt = card.marketplaceText;

  if (mt) {
    return `Название:
${mt.title}

Краткое описание:
${mt.shortDescription}

Полное описание:
${mt.fullDescription}

Преимущества:
${mt.advantages.map((benefit) => `- ${benefit}`).join("\n")}

СЕО-ключи:
${mt.keywords.join(", ")}`;
  }

  return `Название:
${card.title}

Описание:
${card.fullDescription}

Преимущества:
${card.benefits.map((benefit) => `- ${benefit}`).join("\n")}

СЕО-ключи:
${card.keywords.join(", ")}

Рекомендации для ${card.marketplace}:
${card.marketplaceTips.map((tip) => `- ${tip}`).join("\n")}`;
}

export function formatWildberriesText(card: ProductCardResult) {
  const wb = card.marketplaceText?.platformSpecific?.wildberries;
  if (!wb) return formatCardText(card);

  return `Название WB:
${wb.wbName}

Описание WB:
${wb.wbDescription}

Характеристики:
${wb.wbCharacteristics.map((c) => `- ${c.key}: ${c.value}`).join("\n")}

Safe-тексты для фото:
${wb.wbSafeImageTexts.map((t) => `- ${t}`).join("\n")}

Что нельзя писать на фото:
${wb.wbForbiddenImageTexts.map((t) => `- ${t}`).join("\n")}

Чеклист перед загрузкой:
${(card.marketplaceText?.exportChecklist ?? []).map((t) => `- ${t}`).join("\n")}`;
}

export function formatOzonText(card: ProductCardResult) {
  const oz = card.marketplaceText?.platformSpecific?.ozon;
  if (!oz) return formatCardText(card);

  return `Название Ozon:
${oz.ozonName}

Аннотация:
${oz.ozonAnnotation}

Описание:
${oz.ozonDescription}

Rich-content:
${oz.ozonRichContentBlocks.map((b) => `## ${b.title}\n${b.text}`).join("\n\n")}

Характеристики:
${oz.ozonCharacteristics.map((c) => `- ${c.key}: ${c.value}`).join("\n")}

Медиа-рекомендации:
${oz.ozonMediaTips.map((t) => `- ${t}`).join("\n")}`;
}

export function formatAvitoText(card: ProductCardResult) {
  const av = card.marketplaceText?.platformSpecific?.avito;
  if (!av) return formatCardText(card);

  return `Заголовок объявления:
${av.avitoTitle}

Описание:
${av.avitoDescription}

Цена и условия:
${av.avitoPriceBlock}

Преимущества:
${av.avitoBenefits.map((b) => `- ${b}`).join("\n")}

CTA:
${av.avitoCallToAction}

Доставка:
${av.avitoDeliveryText}

Частые вопросы:
${av.avitoQuestionsAnswers.map((qa) => `В: ${qa.question}\nО: ${qa.answer}`).join("\n\n")}`;
}

export function formatYandexMarketText(card: ProductCardResult) {
  const ym = card.marketplaceText?.platformSpecific?.yandexMarket;
  if (!ym) return formatCardText(card);

  return `Название Яндекс Маркет:
${ym.yandexName}

Описание:
${ym.yandexDescription}

Характеристики:
${ym.yandexCharacteristics.map((c) => `- ${c.key}: ${c.value}`).join("\n")}

Safe-тексты для фото:
${ym.yandexSafeImageTexts.map((t) => `- ${t}`).join("\n")}

Что нельзя писать на фото:
${ym.yandexForbiddenImageTexts.map((t) => `- ${t}`).join("\n")}

Чеклист:
${(card.marketplaceText?.exportChecklist ?? []).map((t) => `- ${t}`).join("\n")}`;
}

export function formatSeoText(card: ProductCardResult) {
  const mt = card.marketplaceText;
  if (mt) {
    return `Заголовок СЕО:
${mt.seoTitle}

Ключевые слова:
${mt.keywords.join(", ")}

Краткое описание:
${mt.shortDescription}`;
  }

  return `Заголовок СЕО:
${card.title}

Ключевые слова:
${card.keywords.join(", ")}

Краткое описание:
${card.shortDescription}`;
}

export function formatInfographicText(card: ProductCardResult) {
  const mt = card.marketplaceText;
  const texts = mt?.infographicTexts?.length ? mt.infographicTexts : card.infographicTexts;
  const imageTexts = mt?.imageTexts ?? [];

  const lines = ["Тексты для инфографики:"];
  for (const text of texts) {
    lines.push(`- ${text}`);
  }
  if (imageTexts.length) {
    lines.push("", "Тексты для фото:");
    for (const text of imageTexts) {
      lines.push(`- ${text}`);
    }
  }

  const wb = mt?.platformSpecific?.wildberries;
  if (wb?.wbSafeImageTexts.length) {
    lines.push("", "WB safe-тексты:");
    for (const text of wb.wbSafeImageTexts) {
      lines.push(`- ${text}`);
    }
  }

  const ym = mt?.platformSpecific?.yandexMarket;
  if (ym?.yandexSafeImageTexts.length) {
    lines.push("", "Яндекс Маркет safe-тексты:");
    for (const text of ym.yandexSafeImageTexts) {
      lines.push(`- ${text}`);
    }
  }

  return lines.join("\n");
}

export function formatPlatformCopyText(card: ProductCardResult, platform: MarketplacePlatform) {
  switch (platform) {
    case "wildberries":
      return formatWildberriesText(card);
    case "ozon":
      return formatOzonText(card);
    case "avito":
      return formatAvitoText(card);
    case "yandex_market":
      return formatYandexMarketText(card);
  }
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function copyCardDescription(card: ProductCardResult) {
  await copyText(formatCardText(card));
}

export async function copyPlatformText(card: ProductCardResult, platform: MarketplacePlatform) {
  await copyText(formatPlatformCopyText(card, platform));
}

export async function copySeoText(card: ProductCardResult) {
  await copyText(formatSeoText(card));
}

export async function copyInfographicText(card: ProductCardResult) {
  await copyText(formatInfographicText(card));
}

export async function downloadPreviewPng(node: HTMLElement | null, cardTitle = "marketcard") {
  const dataUrl = await createPreviewPngDataUrl(node);
  triggerDownload(dataUrl, `${slugify(cardTitle)}.png`);
}

export async function createPreviewPngDataUrl(node: HTMLElement | null) {
  if (!node) {
    throw new Error("Preview node is not available");
  }

  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff"
    });
  } catch {
    return fallbackCanvas(node);
  }
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "marketcard";
}

async function fallbackCanvas(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const scale = 2;
  const size = Math.max(1000, rect.width * scale, rect.height * scale);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available");
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111827";
  ctx.font = "700 28px Arial";
  ctx.fillText(BRAND.marketCard, 32, 52);
  ctx.font = "400 18px Arial";
  ctx.fillText("PNG fallback export. Use browser export for full visual fidelity.", 32, 88);

  return canvas.toDataURL("image/png");
}
