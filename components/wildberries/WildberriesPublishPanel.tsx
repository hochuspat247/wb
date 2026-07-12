"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageUp,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
  Wand2,
  X
} from "lucide-react";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { WildberriesGenerateCarouselPanel } from "@/components/wildberries/WildberriesGenerateCarouselPanel";
import { WildberriesSubscriptionOverlay } from "@/components/wildberries/WildberriesSubscriptionOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { publishWildberriesCard, searchWildberriesSubjects } from "@/lib/api/wildberries";
import { fileToBase64, getGeneratedCoverSrc, validateImageFile } from "@/lib/image";
import { reachGoal } from "@/lib/metrika";
import type { ProductCardResult } from "@/types/product-card";
import type { WildberriesPublishResult, WildberriesSubject } from "@/types/wildberries";

type PublishSlide = {
  id: string;
  type: "main" | "card" | "upload";
  label: string;
  previewUrl: string;
  cardId?: string;
  imageBase64?: string;
  imageMimeType?: string;
};

type WildberriesPublishPanelProps = {
  card: ProductCardResult;
  relatedCards?: ProductCardResult[];
  historyCards?: ProductCardResult[];
  wbConnected: boolean;
  wbUnlocked: boolean;
  compact?: boolean;
  onNeedConnect?: () => void;
  onCardsGenerated?: (cards: ProductCardResult[]) => void;
  onQuotaChange?: (quota: { remaining: number; used: number; credits: number }) => void;
};

function buildMainSlide(card: ProductCardResult): PublishSlide {
  return {
    id: `main-${card.id}`,
    type: "main",
    label: "Титульник",
    previewUrl: getGeneratedCoverSrc(card) || card.previewImageUrl || card.imageDataUrl || "",
    cardId: card.id
  };
}

function buildCardSlide(card: ProductCardResult): PublishSlide {
  return {
    id: `card-${card.id}`,
    type: "card",
    label: card.seriesPlanItem?.title || card.headline || `Слайд ${card.seriesIndex ?? ""}`.trim(),
    previewUrl: getGeneratedCoverSrc(card) || card.previewImageUrl || card.imageDataUrl || "",
    cardId: card.id
  };
}

export function WildberriesPublishPanel({
  card,
  relatedCards = [],
  historyCards = [],
  wbConnected,
  wbUnlocked,
  compact = false,
  onNeedConnect,
  onCardsGenerated,
  onQuotaChange
}: WildberriesPublishPanelProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [slides, setSlides] = useState<PublishSlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wbPublishOpen, setWbPublishOpen] = useState(true);
  const [wbSubjectQuery, setWbSubjectQuery] = useState("");
  const [wbSubjects, setWbSubjects] = useState<WildberriesSubject[]>([]);
  const [wbSelectedSubject, setWbSelectedSubject] = useState<WildberriesSubject | null>(null);
  const [wbVendorCode, setWbVendorCode] = useState("");
  const [wbBrand, setWbBrand] = useState("");
  const [wbPrice, setWbPrice] = useState("");
  const [wbDimensions, setWbDimensions] = useState("");
  const [wbWeight, setWbWeight] = useState("");
  const [wbTechSize, setWbTechSize] = useState("0");
  const [wbWbSize, setWbWbSize] = useState("");
  const [wbBarcode, setWbBarcode] = useState("");
  const [wbPublishing, setWbPublishing] = useState(false);
  const [wbSearching, setWbSearching] = useState(false);
  const [wbPublishMessage, setWbPublishMessage] = useState("");
  const [wbPublishResult, setWbPublishResult] = useState<WildberriesPublishResult | null>(null);

  useEffect(() => {
    const initialSlides = [
      buildMainSlide(card),
      ...relatedCards
        .filter((item) => item.id !== card.id)
        .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))
        .map(buildCardSlide)
    ];
    setSlides(initialSlides);
    setActiveSlideId(initialSlides[0]?.id ?? null);
  }, [card, relatedCards]);

  useEffect(() => {
    const source = card.sourceInput;
    setWbSubjectQuery(card.category || source?.category || "");
    setWbSubjects([]);
    setWbSelectedSubject(null);
    setWbVendorCode(source?.sellerSku || "");
    setWbBrand(source?.brand || "");
    setWbPrice(source?.price || card.price || "");
    setWbDimensions(source?.dimensions || "");
    setWbWeight(source?.weight || "");
    setWbTechSize(source?.size || "0");
    setWbWbSize(source?.size || "");
    setWbBarcode("");
    setWbPublishMessage("");
    setWbPublishResult(null);
  }, [card.id, card.category, card.price, card.sourceInput]);

  const availableHistoryCards = useMemo(() => {
    const usedIds = new Set(slides.map((slide) => slide.cardId).filter(Boolean));
    return historyCards.filter((item) => item.id !== card.id && !usedIds.has(item.id));
  }, [card.id, historyCards, slides]);

  function scrollCarousel(direction: "left" | "right") {
    const node = carouselRef.current;
    if (!node) return;
    const amount = direction === "left" ? -220 : 220;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  function removeSlide(slideId: string) {
    setSlides((current) => current.filter((slide) => slide.id !== slideId && slide.type !== "main"));
  }

  function addCardSlide(historyCard: ProductCardResult) {
    setSlides((current) => {
      if (current.some((slide) => slide.cardId === historyCard.id)) {
        return current;
      }
      return [...current, buildCardSlide(historyCard)];
    });
    setPickerOpen(false);
  }

  async function handleUploadSlide(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setWbPublishMessage(validationError);
      return;
    }

    const base64 = await fileToBase64(file);
    const previewUrl = URL.createObjectURL(file);
    const slide: PublishSlide = {
      id: `upload-${crypto.randomUUID()}`,
      type: "upload",
      label: "Загруженное фото",
      previewUrl,
      imageBase64: base64,
      imageMimeType: file.type
    };

    setSlides((current) => [...current, slide]);
    setActiveSlideId(slide.id);
  }

  async function handleSearchWbSubjects() {
    setWbSearching(true);
    setWbPublishMessage("");
    setWbPublishResult(null);

    try {
      const subjects = await searchWildberriesSubjects(wbSubjectQuery);
      setWbSubjects(subjects);
      if (subjects.length === 1) {
        setWbSelectedSubject(subjects[0]);
      }
      if (!subjects.length) {
        setWbPublishMessage("WB не нашёл категорию. Попробуйте другое название.");
      }
    } catch (caught) {
      setWbPublishMessage(caught instanceof Error ? caught.message : "Не удалось найти категории WB.");
    } finally {
      setWbSearching(false);
    }
  }

  async function handlePublishWildberries() {
    if (!wbUnlocked) {
      setWbPublishMessage("Публикация на WB доступна с тарифа «Рост».");
      return;
    }

    if (!wbConnected) {
      onNeedConnect?.();
      setWbPublishMessage("Сначала подключите WB API-токен в настройках кабинета.");
      return;
    }

    if (!wbSelectedSubject) {
      setWbPublishMessage("Выберите категорию WB перед публикацией.");
      return;
    }

    setWbPublishing(true);
    setWbPublishMessage("");
    setWbPublishResult(null);

    try {
      const extraSlides = slides
        .filter((slide) => slide.type !== "main")
        .map((slide) => ({
          cardId: slide.cardId,
          imageBase64: slide.imageBase64,
          imageMimeType: slide.imageMimeType,
          label: slide.label
        }));

      const result = await publishWildberriesCard({
        card,
        subjectId: wbSelectedSubject.subjectID,
        slides: extraSlides,
        techSize: wbTechSize,
        wbSize: wbWbSize,
        barcode: wbBarcode,
        vendorCode: wbVendorCode,
        brand: wbBrand,
        price: wbPrice,
        dimensions: wbDimensions,
        weight: wbWeight
      });

      setWbPublishResult(result);
      reachGoal("wb_publish", { slides: slides.length, mediaUploaded: result.mediaUploaded });
      setWbPublishMessage(
        result.mediaUploaded
          ? `Карточка отправлена в WB с ${result.mediaUploaded} фото. Синхронизация может занять до 30 минут.`
          : "Тексты отправлены в WB. Фото подтянутся после синхронизации карточки — проверьте кабинет WB через 30 минут."
      );
    } catch (caught) {
      setWbPublishMessage(caught instanceof Error ? caught.message : "Не удалось опубликовать карточку в WB.");
    } finally {
      setWbPublishing(false);
    }
  }

  const panelContent = (
    <div
      className={`overflow-hidden rounded-[22px] border border-[#CB11AB]/20 bg-[linear-gradient(160deg,rgba(203,17,171,0.08),rgba(255,255,255,0.02))] ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[#CB11AB]">
            <UploadCloud size={18} />
            <p className="text-xs font-black uppercase tracking-[0.16em]">Публикация на Wildberries</p>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
              Beta
            </span>
          </div>
          <h3 className="mt-2 text-lg font-black text-ink sm:text-xl">Карусель фото + тексты в WB</h3>
          <p className="mt-1 text-sm font-semibold text-muted">
            Титульник уже готов. Добавьте слайды из истории, сгенерируйте пакет или загрузите фото — и отправьте всё в
            WB одной кнопкой.
          </p>
        </div>
        <Button onClick={() => setWbPublishOpen((value) => !value)} size="sm" variant="secondary">
          {wbPublishOpen ? "Свернуть" : "Развернуть"}
        </Button>
      </div>

      <WildberriesBetaNotice className="mt-4" compact />

      <div className="relative mt-5">
        <button
          aria-label="Прокрутить влево"
          className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-clay bg-card/95 text-ink shadow-sm backdrop-blur sm:grid"
          onClick={() => scrollCarousel("left")}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Прокрутить вправо"
          className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-clay bg-card/95 text-ink shadow-sm backdrop-blur sm:grid"
          onClick={() => scrollCarousel("right")}
          type="button"
        >
          <ChevronRight size={18} />
        </button>

        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
        >
          {slides.map((slide) => (
            <button
              className={`group relative w-[148px] shrink-0 snap-start overflow-hidden rounded-[18px] border text-left transition ${
                activeSlideId === slide.id
                  ? "border-[#CB11AB] shadow-[0_12px_40px_rgba(203,17,171,0.18)]"
                  : "border-clay hover:border-[#CB11AB]/40"
              }`}
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              type="button"
            >
              <div className="relative aspect-[4/5] bg-paper">
                {slide.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-full w-full object-cover" src={slide.previewUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-xs font-semibold text-muted">4:5</div>
                )}
                {slide.type === "main" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-[#CB11AB] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                    Титульник
                  </span>
                ) : null}
                {slide.type !== "main" ? (
                  <button
                    aria-label="Удалить слайд"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeSlide(slide.id);
                    }}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
              <div className="border-t border-clay/80 bg-card/80 px-3 py-2">
                <p className="truncate text-xs font-bold text-ink">{slide.label}</p>
              </div>
            </button>
          ))}

          <div className="flex w-[148px] shrink-0 snap-start flex-col gap-2">
            <button
              className="grid flex-1 place-items-center gap-2 rounded-[18px] border border-dashed border-[#CB11AB]/45 bg-[#CB11AB]/5 px-3 py-4 text-center transition hover:border-[#CB11AB] hover:bg-[#CB11AB]/10"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <ImageUp className="text-[#CB11AB]" size={22} />
              <span className="text-xs font-black text-ink">Загрузить фото</span>
            </button>
            <button
              className="grid flex-1 place-items-center gap-2 rounded-[18px] border border-dashed border-clay bg-card/60 px-3 py-4 text-center transition hover:border-accent/40 hover:bg-accent/5"
              onClick={() => setPickerOpen((value) => !value)}
              type="button"
            >
              <Plus size={22} />
              <span className="text-xs font-black text-ink">Из истории</span>
            </button>
            <button
              className="grid flex-1 place-items-center gap-2 rounded-[18px] border border-dashed border-clay bg-card/60 px-3 py-4 text-center transition hover:border-accent/40 hover:bg-accent/5"
              onClick={() => setGenerateOpen((value) => !value)}
              type="button"
            >
              <Wand2 size={22} />
              <span className="text-xs font-black text-ink">Сгенерировать</span>
            </button>
          </div>
        </div>
      </div>

      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUploadSlide(file);
          }
          event.currentTarget.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      {pickerOpen && availableHistoryCards.length ? (
        <div className="mt-4 rounded-[16px] border border-clay bg-card/70 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Добавить из истории</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {availableHistoryCards.slice(0, 8).map((historyCard) => (
              <button
                className="flex items-center gap-3 rounded-[14px] border border-clay bg-paper/50 px-3 py-2 text-left transition hover:border-[#CB11AB]/35"
                key={historyCard.id}
                onClick={() => addCardSlide(historyCard)}
                type="button"
              >
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-clay bg-paper">
                  {getGeneratedCoverSrc(historyCard) || historyCard.previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={getGeneratedCoverSrc(historyCard) || historyCard.previewImageUrl || ""}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{historyCard.headline || historyCard.title}</p>
                  <p className="truncate text-xs text-muted">
                    {historyCard.seriesPlanItem?.title || historyCard.marketplace}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {generateOpen ? (
        <WildberriesGenerateCarouselPanel
          historyCards={historyCards}
          onClose={() => setGenerateOpen(false)}
          onGenerated={(cards) => {
            for (const generatedCard of cards) {
              addCardSlide(generatedCard);
            }
            setGenerateOpen(false);
            onCardsGenerated?.(cards);
          }}
          onQuotaChange={onQuotaChange}
          sourceCard={card}
        />
      ) : null}

      {!wbConnected ? (
        <div className="mt-4 rounded-[16px] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-ink">
          Подключите WB API-токен в настройках кабинета, чтобы отправлять карточки.
          <Button className="mt-3" onClick={onNeedConnect} size="sm" variant="secondary">
            Перейти в настройки
          </Button>
        </div>
      ) : null}

      {wbPublishOpen ? (
        <div className="mt-5 space-y-4 rounded-[18px] border border-clay bg-card/50 p-4">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              onChange={(event) => setWbSubjectQuery(event.target.value)}
              placeholder="Категория WB, например: кроссовки"
              value={wbSubjectQuery}
            />
            <Button disabled={wbSearching} onClick={() => void handleSearchWbSubjects()} size="sm" variant="secondary">
              <Search size={16} />
              {wbSearching ? "Ищем..." : "Найти"}
            </Button>
          </div>

          {wbSubjects.length ? (
            <div className="grid gap-2">
              {wbSubjects.map((subject) => (
                <button
                  className={`rounded-[12px] border px-3 py-2 text-left text-sm font-semibold transition ${
                    wbSelectedSubject?.subjectID === subject.subjectID
                      ? "border-[#CB11AB] bg-[#CB11AB]/10 text-ink"
                      : "border-clay bg-paper text-muted hover:border-[#CB11AB]/35 hover:text-ink"
                  }`}
                  key={subject.subjectID}
                  onClick={() => setWbSelectedSubject(subject)}
                  type="button"
                >
                  {subject.subjectName}
                  {subject.parentName ? <span className="ml-2 text-xs opacity-60">{subject.parentName}</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Артикул продавца
              <Input onChange={(event) => setWbVendorCode(event.target.value)} placeholder="SKU-12345" value={wbVendorCode} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Бренд
              <Input onChange={(event) => setWbBrand(event.target.value)} placeholder="Нет бренда" value={wbBrand} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Цена
              <Input onChange={(event) => setWbPrice(event.target.value)} placeholder="1490 ₽" value={wbPrice} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Габариты
              <Input onChange={(event) => setWbDimensions(event.target.value)} placeholder="20x15x8 см" value={wbDimensions} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Вес
              <Input onChange={(event) => setWbWeight(event.target.value)} placeholder="350 г" value={wbWeight} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-muted">
              Штрихкод
              <Input
                onChange={(event) => setWbBarcode(event.target.value)}
                placeholder="Пусто — сгенерируем в WB"
                value={wbBarcode}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={wbPublishing || !wbSelectedSubject || !wbConnected} onClick={() => void handlePublishWildberries()}>
              {wbPublishing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Отправляем в WB...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Опубликовать {slides.length > 1 ? `${slides.length} фото` : "на WB"}
                </>
              )}
            </Button>
            {wbPublishResult ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mint">
                <CheckCircle2 size={15} />
                Артикул {wbPublishResult.vendorCode}
                {wbPublishResult.mediaUploaded ? ` · ${wbPublishResult.mediaUploaded} фото` : ""}
              </span>
            ) : null}
          </div>

          {wbPublishMessage ? (
            <p className={`text-xs font-semibold leading-relaxed ${wbPublishResult ? "text-mint" : "text-muted"}`}>
              {wbPublishMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (!wbUnlocked && compact) {
    return <WildberriesSubscriptionOverlay unlocked={false}>{panelContent}</WildberriesSubscriptionOverlay>;
  }

  return panelContent;
}
