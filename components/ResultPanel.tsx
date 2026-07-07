"use client";

import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import { AlertTriangle, Clipboard, Download, FileJson, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import {
  copyCardDescription,
  copyInfographicText,
  copyPlatformText,
  copySeoText,
  downloadJson,
  downloadPreviewPng
} from "@/lib/download";
import { base64ToDataUrl, downloadBase64Image, downloadImageFromUrl } from "@/lib/image";
import { reachGoal } from "@/lib/metrika";
import type { MarketplacePlatform } from "@/types/marketplace";
import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";

type ResultPanelProps = {
  card: ProductCardResult | null;
  onDownloadPng: () => Promise<void>;
  onSave: () => void;
  previewRef?: RefObject<HTMLDivElement | null>;
  dark?: boolean;
};

const ALL_TABS = [
  { id: "general", label: "Общее" },
  { id: "wildberries", label: "Wildberries" },
  { id: "ozon", label: "Ozon" },
  { id: "avito", label: "Avito" },
  { id: "yandex", label: "Яндекс Маркет" },
  { id: "seo", label: "SEO" },
  { id: "infographic", label: "Инфографика" },
  { id: "check", label: "Проверка" }
] as const;

function getDesignPresetBadge(preset?: ImageDesignPreset) {
  if (preset === "luxury-catalog") return "Luxury Catalog";
  if (preset === "standard") return "Standard";
  return "Premium Marketplace";
}

function orderTabs(platform?: MarketplacePlatform) {
  if (!platform) return [...ALL_TABS];

  const platformTabId =
    platform === "wildberries"
      ? "wildberries"
      : platform === "ozon"
        ? "ozon"
        : platform === "avito"
          ? "avito"
          : "yandex";

  const rest = ALL_TABS.filter((t) => t.id !== platformTabId);
  const platformTab = ALL_TABS.find((t) => t.id === platformTabId);
  return platformTab ? [platformTab, ...rest] : [...ALL_TABS];
}

function ModerationBadge({ textMode }: { textMode?: ProductCardResult["textMode"] }) {
  if (textMode === "marketplace_safe") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
        <ShieldCheck size={14} />
        Безопасно для загрузки
      </span>
    );
  }

  if (textMode === "promo_creative") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
        <AlertTriangle size={14} />
        Промо-режим: проверьте правила площадки
      </span>
    );
  }

  return null;
}

function CharList({ items, dark }: { items: { key: string; value: string }[]; dark?: boolean }) {
  return (
    <ul className={`mt-2 space-y-1 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
      {items.map((c) => (
        <li key={`${c.key}-${c.value}`}>
          — {c.key}: {c.value}
        </li>
      ))}
    </ul>
  );
}

function TextList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className={`mt-2 space-y-1 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
      {items.map((item) => (
        <li key={item}>— {item}</li>
      ))}
    </ul>
  );
}

export function ResultPanel({ card, onDownloadPng, onSave, previewRef, dark = false }: ResultPanelProps) {
  const platform = card?.platform ?? card?.marketplaceText?.platform;
  const tabs = useMemo(() => orderTabs(platform), [platform]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "general");

  useEffect(() => {
    setActiveTab(tabs[0]?.id ?? "general");
  }, [card?.id, tabs]);

  if (!card) {
    return null;
  }

  const currentCard = card;
  const mt = currentCard.marketplaceText;
  const benefits = mt?.advantages?.length ? mt.advantages : (currentCard.benefits ?? []);
  const keywords = mt?.keywords?.length ? mt.keywords : (currentCard.keywords ?? []);
  const infographicTexts = mt?.infographicTexts?.length ? mt.infographicTexts : (currentCard.infographicTexts ?? []);
  const imagePrompt = currentCard.generatedImagePrompt || "";
  const hasAiImage = Boolean(imagePrompt) && !currentCard.generatedImageIsFallback;
  const headingClass = `font-semibold ${dark ? "text-white" : "text-ink"}`;
  const textClass = `text-sm ${dark ? "text-white/60" : "text-muted"}`;
  const tabsClass = dark ? "border-white/10 bg-white/5" : "";

  async function handleDownloadPng() {
    reachGoal("download_png");
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

  function handleCopyDescription() {
    reachGoal("copy_description", { source: "description" });
    void copyCardDescription(currentCard);
  }

  function handleCopyPlatformText(platformName: MarketplacePlatform) {
    reachGoal("copy_description", { source: platformName });
    void copyPlatformText(currentCard, platformName);
  }

  function handleCopySeoText() {
    reachGoal("copy_description", { source: "seo" });
    void copySeoText(currentCard);
  }

  function handleCopyInfographicText() {
    reachGoal("copy_description", { source: "infographic" });
    void copyInfographicText(currentCard);
  }

  function handleDownloadJson() {
    reachGoal("download_json");
    downloadJson(currentCard);
  }

  const wb = mt?.platformSpecific.wildberries;
  const oz = mt?.platformSpecific.ozon;
  const av = mt?.platformSpecific.avito;
  const ym = mt?.platformSpecific.yandexMarket;

  return (
    <Card className={dark ? "border-white/10 bg-white/5 text-white" : ""} padding="md">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{currentCard.marketplace}</Badge>
        <Badge variant="outline">{currentCard.style}</Badge>
        {hasAiImage ? <Badge variant="dark">{getDesignPresetBadge(currentCard.designPreset)}</Badge> : null}
        <ModerationBadge textMode={currentCard.textMode ?? mt?.mode} />
      </div>

      <h3 className={`mt-4 text-xl font-bold ${dark ? "text-white" : "text-ink"}`}>
        {mt?.title ?? currentCard.title}
      </h3>
      <p className={`mt-3 leading-7 ${dark ? "text-white/60" : "text-muted"}`}>
        {mt?.shortDescription ?? currentCard.shortDescription}
      </p>

      <div className="mt-5 overflow-x-auto">
        <Tabs active={activeTab} className={tabsClass} onChange={setActiveTab} tabs={[...tabs]} />
      </div>

      <div className="mt-5">
        <TabPanel active={activeTab === "general"}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className={headingClass}>Преимущества</h4>
              <TextList dark={dark} items={benefits} />
            </div>
            <div>
              <h4 className={headingClass}>Характеристики</h4>
              <CharList dark={dark} items={mt?.characteristics ?? currentCard.characteristics ?? []} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className={headingClass}>Полное описание</h4>
            <p className={`mt-2 leading-7 ${textClass}`}>{mt?.fullDescription ?? currentCard.fullDescription}</p>
          </div>
        </TabPanel>

        <TabPanel active={activeTab === "wildberries"}>
          {wb ? (
            <div className="space-y-4">
              <div>
                <h4 className={headingClass}>Название WB</h4>
                <p className={textClass}>{wb.wbName}</p>
              </div>
              <div>
                <h4 className={headingClass}>Описание WB</h4>
                <p className={`mt-2 leading-7 ${textClass}`}>{wb.wbDescription}</p>
              </div>
              <div>
                <h4 className={headingClass}>Характеристики WB</h4>
                <CharList dark={dark} items={wb.wbCharacteristics} />
              </div>
              <div>
                <h4 className={headingClass}>Safe-тексты для фото</h4>
                <TextList dark={dark} items={wb.wbSafeImageTexts} />
              </div>
              <div>
                <h4 className={headingClass}>Что нельзя писать на фото</h4>
                <TextList dark={dark} items={wb.wbForbiddenImageTexts} />
              </div>
              <div>
                <h4 className={headingClass}>Чеклист перед загрузкой</h4>
                <TextList dark={dark} items={mt?.exportChecklist ?? []} />
              </div>
            </div>
          ) : (
            <p className={textClass}>Данные Wildberries не сгенерированы.</p>
          )}
        </TabPanel>

        <TabPanel active={activeTab === "ozon"}>
          {oz ? (
            <div className="space-y-4">
              <div>
                <h4 className={headingClass}>Название Ozon</h4>
                <p className={textClass}>{oz.ozonName}</p>
              </div>
              <div>
                <h4 className={headingClass}>Аннотация</h4>
                <p className={`mt-2 leading-7 ${textClass}`}>{oz.ozonAnnotation}</p>
              </div>
              <div>
                <h4 className={headingClass}>Описание</h4>
                <p className={`mt-2 leading-7 ${textClass}`}>{oz.ozonDescription}</p>
              </div>
              <div>
                <h4 className={headingClass}>Rich-content блоки</h4>
                <div className="mt-2 space-y-3">
                  {oz.ozonRichContentBlocks.map((block) => (
                    <div key={block.title}>
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>{block.title}</p>
                      <p className={textClass}>{block.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className={headingClass}>Характеристики</h4>
                <CharList dark={dark} items={oz.ozonCharacteristics} />
              </div>
              <div>
                <h4 className={headingClass}>Медиа-рекомендации</h4>
                <TextList dark={dark} items={oz.ozonMediaTips} />
              </div>
            </div>
          ) : (
            <p className={textClass}>Данные Ozon не сгенерированы.</p>
          )}
        </TabPanel>

        <TabPanel active={activeTab === "avito"}>
          {av ? (
            <div className="space-y-4">
              <div>
                <h4 className={headingClass}>Заголовок объявления</h4>
                <p className={textClass}>{av.avitoTitle}</p>
              </div>
              <div>
                <h4 className={headingClass}>Описание</h4>
                <p className={`mt-2 leading-7 ${textClass}`}>{av.avitoDescription}</p>
              </div>
              <div>
                <h4 className={headingClass}>Цена и условия</h4>
                <p className={textClass}>{av.avitoPriceBlock}</p>
              </div>
              <div>
                <h4 className={headingClass}>Преимущества</h4>
                <TextList dark={dark} items={av.avitoBenefits} />
              </div>
              <div>
                <h4 className={headingClass}>CTA</h4>
                <p className={textClass}>{av.avitoCallToAction}</p>
              </div>
              <div>
                <h4 className={headingClass}>Частые вопросы и ответы</h4>
                <div className="mt-2 space-y-3">
                  {av.avitoQuestionsAnswers.map((qa) => (
                    <div key={qa.question}>
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>{qa.question}</p>
                      <p className={textClass}>{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className={textClass}>Данные Avito не сгенерированы.</p>
          )}
        </TabPanel>

        <TabPanel active={activeTab === "yandex"}>
          {ym ? (
            <div className="space-y-4">
              <div>
                <h4 className={headingClass}>Название</h4>
                <p className={textClass}>{ym.yandexName}</p>
              </div>
              <div>
                <h4 className={headingClass}>Описание</h4>
                <p className={`mt-2 leading-7 ${textClass}`}>{ym.yandexDescription}</p>
              </div>
              <div>
                <h4 className={headingClass}>Характеристики</h4>
                <CharList dark={dark} items={ym.yandexCharacteristics} />
              </div>
              <div>
                <h4 className={headingClass}>Safe-тексты для фото</h4>
                <TextList dark={dark} items={ym.yandexSafeImageTexts} />
              </div>
              <div>
                <h4 className={headingClass}>Что нельзя писать на фото</h4>
                <TextList dark={dark} items={ym.yandexForbiddenImageTexts} />
              </div>
              <div>
                <h4 className={headingClass}>Чеклист</h4>
                <TextList dark={dark} items={mt?.exportChecklist ?? []} />
              </div>
            </div>
          ) : (
            <p className={textClass}>Данные Яндекс Маркета не сгенерированы.</p>
          )}
        </TabPanel>

        <TabPanel active={activeTab === "seo"}>
          <div>
            <h4 className={headingClass}>SEO Title</h4>
            <p className={textClass}>{mt?.seoTitle ?? currentCard.title}</p>
          </div>
          <div className="mt-4">
            <h4 className={headingClass}>SEO-ключи</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </TabPanel>

        <TabPanel active={activeTab === "infographic"}>
          <div>
            <h4 className={headingClass}>Тексты для инфографики</h4>
            <TextList dark={dark} items={infographicTexts} />
          </div>
          {mt?.imageTexts?.length ? (
            <div className="mt-4">
              <h4 className={headingClass}>Тексты для фото</h4>
              <TextList dark={dark} items={mt.imageTexts} />
            </div>
          ) : null}
        </TabPanel>

        <TabPanel active={activeTab === "check"}>
          {mt?.moderationWarnings?.length ? (
            <div className="mb-4">
              <h4 className={headingClass}>Предупреждения модерации</h4>
              <TextList dark={dark} items={mt.moderationWarnings} />
            </div>
          ) : null}
          {mt?.improvementTips?.length ? (
            <div className="mb-4">
              <h4 className={headingClass}>Советы по улучшению</h4>
              <TextList dark={dark} items={mt.improvementTips} />
            </div>
          ) : null}
          {mt?.exportChecklist?.length ? (
            <div>
              <h4 className={headingClass}>Чеклист экспорта</h4>
              <TextList dark={dark} items={mt.exportChecklist} />
            </div>
          ) : (
            <p className={textClass}>Чеклист не сгенерирован.</p>
          )}
        </TabPanel>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleDownloadPng} size="sm" variant="dark">
          <Download size={16} />
          Скачать PNG
        </Button>
        <Button onClick={handleCopyDescription} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать описание
        </Button>
        <Button onClick={() => handleCopyPlatformText("wildberries")} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать для WB
        </Button>
        <Button onClick={() => handleCopyPlatformText("ozon")} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать для Ozon
        </Button>
        <Button onClick={() => handleCopyPlatformText("avito")} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать для Avito
        </Button>
        <Button onClick={() => handleCopyPlatformText("yandex_market")} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать для Яндекс Маркета
        </Button>
        <Button onClick={handleCopySeoText} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать SEO
        </Button>
        <Button onClick={handleCopyInfographicText} size="sm" variant="secondary">
          <Clipboard size={16} />
          Скопировать тексты для инфографики
        </Button>
        <Button onClick={handleDownloadJson} size="sm" variant="secondary">
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
