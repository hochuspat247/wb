"use client";

import type { RefObject } from "react";
import { Clipboard, Download, FileJson } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { copyCardDescription, downloadJson, downloadPreviewPng } from "@/lib/download";
import { base64ToDataUrl, downloadBase64Image, downloadImageFromUrl } from "@/lib/image";
import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";

type ResultPanelProps = {
  card: ProductCardResult | null;
  onDownloadPng: () => Promise<void>;
  onSave: () => void;
  previewRef?: RefObject<HTMLDivElement | null>;
  dark?: boolean;
};

function getDesignPresetBadge(preset?: ImageDesignPreset) {
  if (preset === "luxury-catalog") return "Luxury Catalog";
  if (preset === "standard") return "Standard";
  return "Premium Marketplace";
}

export function ResultPanel({ card, onDownloadPng, onSave, previewRef, dark = false }: ResultPanelProps) {
  if (!card) {
    return null;
  }

  const currentCard = card;
  const benefits = currentCard.benefits ?? [];
  const keywords = currentCard.keywords ?? [];
  const infographicTexts = currentCard.infographicTexts ?? [];
  const imagePrompt = currentCard.generatedImagePrompt || "";
  const hasAiImage = Boolean(imagePrompt) && !currentCard.generatedImageIsFallback;

  async function handleDownloadPng() {
    const remoteImageUrl = currentCard.generatedImageUrl || null;
    const base64ImageUrl =
      currentCard.generatedImageBase64 && currentCard.generatedImageMimeType
        ? base64ToDataUrl(currentCard.generatedImageBase64, currentCard.generatedImageMimeType)
        : null;
    const legacyImageUrl = !remoteImageUrl && !base64ImageUrl ? currentCard.generatedImageDataUrl : null;

    if (remoteImageUrl) {
      await downloadImageFromUrl(remoteImageUrl, "marketcard-ai.png");
      return;
    }

    if (currentCard.generatedImageBase64 && currentCard.generatedImageMimeType) {
      downloadBase64Image(currentCard.generatedImageBase64, currentCard.generatedImageMimeType, "marketcard-ai.png");
      return;
    }

    if (legacyImageUrl) {
      await downloadImageFromUrl(legacyImageUrl, "marketcard-ai.png");
      return;
    }

    if (previewRef?.current) {
      await downloadPreviewPng(previewRef.current, currentCard.title);
      return;
    }

    await onDownloadPng();
  }

  return (
    <Card
      className={dark ? "border-white/10 bg-white/5 text-white" : ""}
      padding="md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{currentCard.marketplace}</Badge>
        <Badge variant="outline">{currentCard.style}</Badge>
        {hasAiImage ? <Badge variant="dark">{getDesignPresetBadge(currentCard.designPreset)}</Badge> : null}
      </div>
      <h3 className={`mt-4 text-xl font-bold ${dark ? "text-white" : "text-ink"}`}>{currentCard.title}</h3>
      <p className={`mt-3 leading-7 ${dark ? "text-white/60" : "text-muted"}`}>{currentCard.shortDescription}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>Преимущества</h4>
          <ul className={`mt-3 space-y-2 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
            {benefits.map((benefit) => (
              <li key={benefit}>— {benefit}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>SEO-ключи</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="outline">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {infographicTexts.length ? (
        <div className="mt-5">
          <h4 className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>Текст для инфографики</h4>
          <ul className={`mt-3 space-y-2 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
            {infographicTexts.map((text) => (
              <li key={text}>— {text}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleDownloadPng} size="sm" variant="dark">
          <Download size={16} />
          Скачать PNG
        </Button>
        <Button onClick={() => copyCardDescription(currentCard)} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать описание
        </Button>
        <Button onClick={() => downloadJson(currentCard)} size="sm" variant="secondary">
          <FileJson size={16} />
          Скачать JSON
        </Button>
        <Button onClick={onSave} size="sm" variant="ghost">
          Сохранить в историю
        </Button>
      </div>
    </Card>
  );
}
