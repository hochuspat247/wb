import { toPng } from "html-to-image";
import type { ProductCardResult } from "@/types/product-card";

export function downloadJson(card: ProductCardResult) {
  const blob = new Blob([JSON.stringify(card, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `marketcard-${card.id}.json`);
  URL.revokeObjectURL(url);
}

export function formatCardText(card: ProductCardResult) {
  return `Название:
${card.title}

Описание:
${card.fullDescription}

Преимущества:
${card.benefits.map((benefit) => `- ${benefit}`).join("\n")}

SEO-ключи:
${card.keywords.join(", ")}

Рекомендации для ${card.marketplace}:
${card.marketplaceTips.map((tip) => `- ${tip}`).join("\n")}`;
}

export async function copyCardDescription(card: ProductCardResult) {
  const text = formatCardText(card);

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
  ctx.fillText("MarketCard AI", 32, 52);
  ctx.font = "400 18px Arial";
  ctx.fillText("PNG fallback export. Use browser export for full visual fidelity.", 32, 88);

  return canvas.toDataURL("image/png");
}
