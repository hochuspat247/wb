"use client";

import type { RefObject } from "react";
import { Clipboard, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copyCardDescription, downloadJson, downloadPreviewPng } from "@/lib/download";
import { base64ToDataUrl, downloadBase64Image, downloadImageFromUrl } from "@/lib/image";
import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";

type ResultPanelProps = {
  card: ProductCardResult | null;
  onDownloadPng: () => Promise<void>;
  onSave: () => void;
  previewRef?: RefObject<HTMLDivElement | null>;
};

function getDesignPresetBadge(preset?: ImageDesignPreset) {
  if (preset === "luxury-catalog") {
    return "Luxury Catalog";
  }

  if (preset === "standard") {
    return "Standard";
  }

  return "Premium Marketplace";
}

export function ResultPanel({ card, onDownloadPng, onSave, previewRef }: ResultPanelProps) {
  if (!card) {
    return (
      <div className="rounded-[22px] border border-dashed border-ink/25 bg-[#fffaf0] p-6 text-center">
        <p className="font-medium text-muted">Здесь появится готовая карточка — загрузите фото и нажмите «Создать карточку».</p>
      </div>
    );
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

  async function handleCopyImagePrompt() {
    if (!imagePrompt) {
      return;
    }

    await navigator.clipboard?.writeText(imagePrompt);
  }

  return (
    <div className="rounded-[22px] border border-ink/15 bg-[#fffaf0] p-6 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-coral px-3 py-1 text-xs font-black text-white">{currentCard.marketplace}</span>
        <span className="rounded-full border border-ink/10 bg-mint/45 px-3 py-1 text-xs font-black text-ink">{currentCard.style}</span>
        {hasAiImage ? (
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">
            {getDesignPresetBadge(currentCard.designPreset)}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-2xl font-black text-ink">{currentCard.title}</h3>
      <p className="mt-3 leading-7 text-muted">{currentCard.shortDescription}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="font-black text-ink">Преимущества</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {benefits.map((benefit) => (
              <li key={benefit}>- {benefit}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-black text-ink">Ключи для поиска</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-bold text-muted" key={keyword}>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
      {infographicTexts.length ? (
        <div className="mt-5">
          <h4 className="font-black text-ink">Текст для инфографики</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {infographicTexts.map((text) => (
              <li key={text}>- {text}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={handleDownloadPng} variant="dark">
          <Download size={17} />
          Скачать PNG
        </Button>
        <Button onClick={() => copyCardDescription(currentCard)} variant="secondary">
          <Clipboard size={17} />
          Скопировать описание
        </Button>
        {imagePrompt ? (
          <Button onClick={handleCopyImagePrompt} variant="secondary">
            <Clipboard size={17} />
            Скопировать промт изображения
          </Button>
        ) : null}
        <Button onClick={() => downloadJson(currentCard)} variant="secondary">
          <FileJson size={17} />
          Скачать JSON
        </Button>
        <Button onClick={onSave} variant="ghost">
          Сохранить
        </Button>
      </div>
    </div>
  );
}
