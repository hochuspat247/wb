"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  History,
  ImageIcon,
  LayoutDashboard,
  Plus,
  Scale,
  Settings,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { CardGenerator } from "@/components/CardGenerator";
import { VideoFromCardFlow, type VideoFlowPhase } from "@/components/video/VideoFromCardFlow";
import { VideoHistorySection } from "@/components/video/VideoHistorySection";
import { CardSavedVideosPanel } from "@/components/video/CardSavedVideosPanel";
import { CompareSection } from "@/components/CompareSection";
import { HistorySection } from "@/components/HistorySection";
import { Logo } from "@/components/Logo";
import { PaymentButton } from "@/components/PaymentButton";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import {
  clearUserCardsRemote,
  fetchUserCards,
  fetchUserProfile,
  fetchUserQuota,
  migrateGuestGenerations,
  migrateLocalCards,
  removeUserCardRemote,
  updateUserProfile
} from "@/lib/api/user";
import { GUEST_ID_KEY } from "@/lib/guest";
import { downloadCardImageAsset } from "@/lib/client/cardImage";
import { applyDownloadPolicyToCard, type DownloadPolicy } from "@/lib/client/watermarkPolicy";
import { downloadBase64Image, downloadImageFromUrl, getGeneratedCoverSrc } from "@/lib/image";
import { DEFAULT_IMAGE_SETTINGS, getImageSettings, saveImageSettings, type ImageSettings } from "@/lib/imageSettings";
import { reachGoal } from "@/lib/metrika";
import { FREE_TRIAL_CARDS, FREE_TOTAL_MARKETING_CARDS } from "@/lib/pricing";
import { clearHistory, getHistory } from "@/lib/storage";
import type { ProductCardResult } from "@/types/product-card";

type Tab = "create" | "history" | "examples" | "compare" | "settings";

function getThumbnail(card: ProductCardResult) {
  return getGeneratedCoverSrc(card) || card.imageDataUrl || null;
}

function CabinetPricingLink({
  className = "",
  onLight = false
}: {
  className?: string;
  onLight?: boolean;
}) {
  return (
    <Link
      className={`cabinet-pricing-cta shrink-0 ${onLight ? "cabinet-pricing-cta--on-light" : ""} ${className}`.trim()}
      href="/#pricing-calculator"
    >
      Тарифы и покупка
      <ExternalLink size={13} />
    </Link>
  );
}

export function CabinetApp() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("create");
  const [videoOrderId, setVideoOrderId] = useState<string | null>(searchParams.get("videoOrder"));
  const [cards, setCards] = useState<ProductCardResult[]>([]);
  const [profileName, setProfileName] = useState("Продавец");
  const [userEmail, setUserEmail] = useState("");
  const [editName, setEditName] = useState("Продавец");
  const [selected, setSelected] = useState<ProductCardResult | null>(null);
  const [videoFlowPhase, setVideoFlowPhase] = useState<VideoFlowPhase>("idle");
  const [loading, setLoading] = useState(true);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [remainingGenerations, setRemainingGenerations] = useState(0);
  const [downloadPolicy, setDownloadPolicy] = useState<DownloadPolicy | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleQuotaChange = useCallback((quota: { remaining: number; cleanDownloadGenerationId?: string | null; downloadsFullyUnlocked?: boolean }) => {
    setRemainingGenerations(quota.remaining);
    setDownloadPolicy({
      cleanDownloadGenerationId: quota.cleanDownloadGenerationId ?? null,
      downloadsFullyUnlocked: Boolean(quota.downloadsFullyUnlocked)
    });
  }, []);

  async function refreshDownloadPolicy() {
    try {
      const quota = await fetchUserQuota();
      handleQuotaChange(quota);
      return quota;
    } catch {
      setDownloadPolicy(null);
      return null;
    }
  }

  const displayCards = useMemo(
    () => cards.map((card) => applyDownloadPolicyToCard(card, downloadPolicy, true)),
    [cards, downloadPolicy]
  );

  const selectedDisplayCard = useMemo(
    () => (selected ? applyDownloadPolicyToCard(selected, downloadPolicy, true) : null),
    [downloadPolicy, selected]
  );

  useEffect(() => {
    setImageSettings(getImageSettings());
  }, []);

  useEffect(() => {
    async function loadCabinet() {
      try {
        const [profile, remoteCards, quota] = await Promise.all([
          fetchUserProfile(),
          fetchUserCards(),
          fetchUserQuota().catch(() => null)
        ]);
        setProfileName(profile.name);
        setUserEmail(profile.email);
        setEditName(profile.name);
        setRemainingGenerations(quota?.remaining ?? profile.quota?.remaining ?? 0);
        if (quota) {
          setDownloadPolicy({
            cleanDownloadGenerationId: quota.cleanDownloadGenerationId ?? null,
            downloadsFullyUnlocked: Boolean(quota.downloadsFullyUnlocked)
          });
        }
        setNeedsEmailVerification(Boolean(profile.needsEmailVerification));
        setEmailDisplay(profile.emailDisplay || profile.email);

        if (searchParams.get("verified") === "1" && !profile.needsEmailVerification) {
          setVerificationMessage("Email подтверждён. Можно генерировать карточки.");
        }

        let nextRemoteCards = remoteCards;
        const guestId = window.localStorage.getItem(GUEST_ID_KEY);

        if (guestId) {
          const migratedCount = await migrateGuestGenerations(guestId).catch(() => 0);

          if (migratedCount > 0) {
            nextRemoteCards = await fetchUserCards();
          }
        }

        const localCards = getHistory();
        if (localCards.length > 0 && nextRemoteCards.length === 0) {
          const migrated = await migrateLocalCards(localCards);
          setCards(migrated);
          clearHistory();
        } else {
          setCards(nextRemoteCards);
        }
      } catch {
        setCards(getHistory());
      } finally {
        setLoading(false);
      }
    }

    void loadCabinet();

    if (window.location.hash === "#create") {
      setTab("create");
    }

    const pendingVideoOrder = searchParams.get("videoOrder");
    if (pendingVideoOrder) {
      setVideoOrderId(pendingVideoOrder);
      setTab("create");
    }
  }, [searchParams]);

  function refreshCards() {
    fetchUserCards()
      .then(setCards)
      .catch(() => setCards(getHistory()));

    void refreshDownloadPolicy();
  }

  function refreshCardsAndSelection() {
    fetchUserCards()
      .then((next) => {
        setCards(next);
        setSelected((current) => (current ? next.find((item) => item.id === current.id) || current : null));
      })
      .catch(() => refreshCards());
  }

  function openCreateTab() {
    reachGoal("click_create_card");
    setTab("create");
    window.history.replaceState(null, "", "/cabinet#create");
  }

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: cards.length,
      thisWeek: cards.filter((c) => new Date(c.generatedAt).getTime() > weekAgo).length
    };
  }, [cards]);

  useEffect(() => {
    setVideoFlowPhase("idle");
  }, [selected?.id]);

  async function handleRemove(id: string) {
    try {
      const next = await removeUserCardRemote(id);
      setCards(next);
    } catch {
      setCards((current) => current.filter((item) => item.id !== id));
    }
    if (selected?.id === id) setSelected(null);
  }

  async function handleClearAll() {
    try {
      await clearUserCardsRemote();
    } catch {
      clearHistory();
    }
    setCards([]);
    setSelected(null);
  }

  async function handleSaveProfile() {
    try {
      const saved = await updateUserProfile(editName);
      setProfileName(saved.name);
    } catch {
      setProfileName(editName);
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    setVerificationMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Не удалось отправить письмо.");
      }

      setVerificationMessage(data.message || "Письмо с подтверждением отправлено повторно.");
    } catch (caught) {
      setVerificationMessage(caught instanceof Error ? caught.message : "Не удалось отправить письмо.");
    } finally {
      setResendingVerification(false);
    }
  }

  function handleSaveImageSettings() {
    saveImageSettings(imageSettings);
  }

  async function handleDownload(card: ProductCardResult) {
    const displayCard = applyDownloadPolicyToCard(card, downloadPolicy, true);
    const result = await downloadCardImageAsset(displayCard, "marketcard-ai.png");

    if (!result.missing) {
      return;
    }

    const coverSrc = getGeneratedCoverSrc(displayCard);

    if (coverSrc?.startsWith("data:")) {
      await downloadImageFromUrl(coverSrc, "marketcard-ai.png");
      return;
    }

    if (card.generatedImageUrl) {
      await downloadImageFromUrl(card.generatedImageUrl, "marketcard-ai.png");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader label="Загружаем кабинет…" />
      </div>
    );
  }

  const tabTitles: Record<Tab, string> = {
    create: "Создать карточку",
    history: "История генераций",
    examples: "Примеры карточек",
    compare: "Сравнение с альтернативами",
    settings: "Настройки"
  };

  const tabTitlesMobile: Record<Tab, string> = {
    create: "Создать карточку",
    history: "История",
    examples: "Примеры",
    compare: "Сравнение",
    settings: "Настройки"
  };

  const nav = [
    { id: "create" as const, label: "Создать", shortLabel: "Создать", icon: Wand2 },
    { id: "history" as const, label: "История", shortLabel: "История", icon: History },
    { id: "examples" as const, label: "Примеры", shortLabel: "Примеры", icon: ImageIcon },
    { id: "compare" as const, label: "Сравнение", shortLabel: "Сравн.", icon: Scale },
    { id: "settings" as const, label: "Настройки", shortLabel: "Ещё", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-clay bg-paper p-5 text-white lg:flex">
        <Logo light href="/cabinet" />
        <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Баланс</p>
          <p className="mt-3 text-3xl font-black text-white">
            {remainingGenerations >= 999_000 ? "Безлимит" : remainingGenerations}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/45">генераций доступно</p>
          {remainingGenerations === 0 ? (
            <PaymentButton className="mt-4" count={10} size="sm">
              Купить пакет
            </PaymentButton>
          ) : (
            <CabinetPricingLink className="mt-4 w-full" />
          )}
        </div>
        <nav className="mt-6 grid gap-1">
          {nav.map((item) => (
            <button
              className={`cabinet-sidebar-link ${tab === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <Link className="cabinet-sidebar-link mt-auto" href="/">
          <ArrowLeft size={18} />
          На сайт
        </Link>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-clay bg-paper/88 px-3 py-3 backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-clay bg-card text-ink sm:h-10 sm:w-10 lg:hidden">
              <LayoutDashboard size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted sm:text-xs">Рабочий кабинет</p>
              <p className="truncate text-base font-black text-ink sm:text-xl">
                <span className="sm:hidden">{tabTitlesMobile[tab]}</span>
                <span className="hidden sm:inline">{tabTitles[tab]}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="rounded-full border border-clay bg-card px-2.5 py-1 text-xs font-bold text-mint sm:hidden">
              {remainingGenerations >= 999_000 ? "∞" : remainingGenerations}
            </div>
            <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-clay bg-card px-4 py-2 text-sm font-bold text-muted">
              AI: {imageSettings.imageMode}
            </div>
            <p className="text-sm font-semibold text-muted">{profileName}</p>
            <Button onClick={openCreateTab} size="sm">
              <Plus size={16} />
              Новая карточка
            </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 sm:pb-28 lg:p-8">
          {needsEmailVerification ? (
            <div className="mb-6 rounded-[18px] border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
              <p>Подтвердите email ({emailDisplay}), чтобы генерировать карточки. Проверьте почту после регистрации.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button disabled={resendingVerification} onClick={() => void handleResendVerification()} size="sm" variant="ghost">
                  {resendingVerification ? "Отправляем..." : "Отправить письмо ещё раз"}
                </Button>
                {verificationMessage ? <span className="text-xs text-amber-50/90">{verificationMessage}</span> : null}
              </div>
            </div>
          ) : verificationMessage ? (
            <div className="mb-6 rounded-[18px] border border-mint/25 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint">
              {verificationMessage}
            </div>
          ) : null}

          {tab === "create" ? (
            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
              <div className="hidden gap-3 sm:grid md:grid-cols-3 md:gap-4">
                {[
                  ["Всего карточек", stats.total],
                  ["За неделю", stats.thisWeek],
                  ["Экспорт", "PNG + JSON"]
                ].map(([label, value]) => (
                  <div className="rounded-[22px] border border-clay bg-card p-5" key={label}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">{label}</p>
                    <p className="mt-3 text-3xl font-black text-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 rounded-[16px] border border-mint/20 bg-mint/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[18px] sm:px-4 sm:py-3">
                <p className="text-xs font-bold text-mint sm:text-sm">
                  {remainingGenerations >= 999_000
                    ? "Безлимитные генерации для вашего аккаунта."
                    : `${FREE_TOTAL_MARKETING_CARDS} карточки бесплатно (1 демо + ${FREE_TRIAL_CARDS} после входа). Доступно: ${remainingGenerations}`}
                </p>
                <CabinetPricingLink className="self-start sm:self-auto" onLight />
              </div>
              <CardGenerator
                embedded
                hideHistory
                darkConsole
                initialVideoOrderId={videoOrderId}
                onQuotaChange={handleQuotaChange}
                onSaved={refreshCards}
                onVideoFlowReset={() => {
                  setVideoOrderId(null);
                  window.history.replaceState(null, "", "/cabinet#create");
                }}
                persistToServer
              />
            </div>
          ) : null}

          {tab === "history" ? (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-ink">История</h2>
                  <p className="mt-1 text-sm text-muted">
                    {stats.total} карточек · {stats.thisWeek} за неделю
                  </p>
                </div>
                {cards.length > 0 ? (
                  <Button onClick={handleClearAll} size="sm" variant="ghost">
                    <Trash2 size={16} />
                    Очистить всё
                  </Button>
                ) : null}
              </div>
              {cards.length === 0 ? (
                <EmptyState onCreate={openCreateTab} />
              ) : (
                <HistorySection
                  history={displayCards}
                  onClear={handleClearAll}
                  onOpen={(card) => setSelected(cards.find((item) => item.id === card.id) ?? card)}
                  onRemove={handleRemove}
                />
              )}
              <VideoHistorySection
                cards={cards}
                onOpen={(order) => {
                  const sourceCard = cards.find((item) => item.id === order.sourceGenerationId);
                  if (sourceCard) {
                    setSelected(sourceCard);
                  }
                }}
              />
            </div>
          ) : null}

          {tab === "examples" ? (
            <div className="mx-auto max-w-2xl text-center">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-ink">Примеры карточек</h2>
                <p className="mt-3 text-muted">
                  Посмотрите галерею премиальных карточек на главной странице — до и после обработки.
                </p>
                <Link className="mt-6 inline-block" href="/#examples">
                  <Button>
                    <ExternalLink size={16} />
                    Открыть примеры
                  </Button>
                </Link>
              </Card>
            </div>
          ) : null}

          {tab === "compare" ? (
            <CompareSection embedded />
          ) : null}

          {tab === "settings" ? (
            <div className="mx-auto max-w-lg space-y-5">
              <Card padding="lg">
                <h2 className="text-lg font-bold text-ink">Профиль</h2>
                <p className="mt-1 text-sm text-muted">Как к вам обращаться в кабинете</p>
                <label className="mt-5 grid gap-2 text-sm font-semibold text-ink">
                  Имя
                  <Input onChange={(e) => setEditName(e.target.value)} placeholder="Ваше имя" value={editName} />
                </label>
                <Button className="mt-5" onClick={handleSaveProfile} size="sm">
                  Сохранить
                </Button>
              </Card>

              <Card padding="lg">
                <h2 className="text-lg font-bold text-ink">AI-провайдер изображений</h2>
                <p className="mt-1 text-sm text-muted">Настройки генерации обложек</p>
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Провайдер
                    <Select
                      onChange={(e) =>
                        setImageSettings((s) => ({
                          ...s,
                          imageProvider: e.target.value as ImageSettings["imageProvider"]
                        }))
                      }
                      value={imageSettings.imageProvider}
                    >
                      <option value="auto">Авто (рекомендуется)</option>
                      <option value="nanobanana_expert">NanoBanana Expert</option>
                      <option value="gemini">Gemini</option>
                      <option value="html">Базовая обложка 4:5</option>
                    </Select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Режим изображения
                    <Select
                      onChange={(e) =>
                        setImageSettings((s) => ({
                          ...s,
                          imageMode: e.target.value as ImageSettings["imageMode"]
                        }))
                      }
                      value={imageSettings.imageMode}
                    >
                      <option value="pro">Pro (лучшее качество)</option>
                      <option value="fast">Быстрый</option>
                      <option value="legacy">Legacy</option>
                      <option value="html">Базовая обложка 4:5</option>
                    </Select>
                  </label>
                </div>
                <Button className="mt-5" onClick={handleSaveImageSettings} size="sm">
                  Сохранить настройки
                </Button>
              </Card>

              <Card padding="lg">
                <h2 className="text-lg font-bold text-ink">Аккаунт</h2>
                <p className="mt-2 text-sm text-muted">{emailDisplay || userEmail || session?.user?.email}</p>
                <Button className="mt-5" onClick={() => signOut({ callbackUrl: "/" })} size="sm" variant="secondary">
                  Выйти из аккаунта
                </Button>
              </Card>
            </div>
          ) : null}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 gap-0.5 border-t border-clay bg-card/95 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {nav.map((item) => (
          <button
            aria-label={item.label}
            className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 py-2 ${
              tab === item.id ? "bg-accent text-paper" : "text-muted"
            }`}
            key={item.id}
            onClick={() => setTab(item.id)}
            type="button"
          >
            <item.icon size={16} />
            <span className="max-w-full truncate text-[10px] font-black leading-none sm:hidden">{item.shortLabel}</span>
            <span className="hidden max-w-full truncate text-[11px] font-black leading-none sm:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <Card className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden p-0" padding="none">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-clay px-4 py-4 sm:px-6">
              <h3 className="min-w-0 flex-1 pr-2 text-base font-bold leading-snug text-ink sm:text-lg">
                {selected.headline || selected.title}
              </h3>
              <button
                aria-label="Закрыть"
                className="shrink-0 rounded-full p-1 text-muted transition hover:text-ink"
                onClick={() => setSelected(null)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 overflow-x-hidden overflow-y-auto">
              <div
                className={
                  videoFlowPhase === "waiting" || videoFlowPhase === "ready"
                    ? "p-4 sm:p-6"
                    : "grid items-start gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-8"
                }
              >
                {videoFlowPhase === "idle" ? (
                  <div className="relative mx-auto w-full max-w-[280px] shrink-0 overflow-hidden rounded-card border border-clay bg-paper lg:mx-0">
                    {getThumbnail(selectedDisplayCard ?? selected) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="aspect-[4/5] w-full bg-paper object-contain"
                        src={getThumbnail(selectedDisplayCard ?? selected)!}
                      />
                    ) : (
                      <div className="grid aspect-[4/5] place-items-center text-sm text-muted">Нет изображения</div>
                    )}
                    {selectedDisplayCard?.watermarkLocked ? (
                      <div className="pointer-events-none absolute inset-0">
                        <WatermarkOverlay />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="min-w-0 space-y-4">
                  {videoFlowPhase === "idle" ? (
                    <>
                      <p className="text-sm text-muted">
                        {selected.marketplace} · {selected.style}
                      </p>
                      <p className="text-sm leading-relaxed text-muted">{selected.shortDescription}</p>
                      {selected.price ? <p className="text-2xl font-bold text-ink">{selected.price}</p> : null}
                      <p className="text-xs text-muted">{new Date(selected.generatedAt).toLocaleString("ru-RU")}</p>
                      {selectedDisplayCard?.watermarkLocked ? (
                        <p className="text-xs font-semibold text-muted">
                          Карточка с демо-меткой. Без водяного знака доступна только первая генерация или после покупки
                          пакета.
                        </p>
                      ) : null}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button className="w-full" onClick={() => handleDownload(selected!)} size="sm">
                          <Download size={16} />
                          Скачать PNG
                        </Button>
                        <Button className="w-full" onClick={openCreateTab} size="sm" variant="secondary">
                          <ExternalLink size={16} />
                          Создать похожую
                        </Button>
                      </div>
                      <CardSavedVideosPanel card={selected} compact />
                    </>
                  ) : null}
                  <VideoFromCardFlow
                    card={selected}
                    compact
                    onPhaseChange={setVideoFlowPhase}
                    onVideoReady={refreshCardsAndSelection}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="flex flex-col items-center py-16 text-center" padding="lg">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-card bg-paper text-ink">
        <Wand2 size={24} />
      </div>
      <h3 className="text-xl font-bold text-ink">Пока нет карточек</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Создайте первую карточку и сохраните результат — она появится в истории.
      </p>
      <Button className="mt-8" onClick={onCreate} type="button">
        <Plus size={16} />
        Создать первую карточку
      </Button>
    </Card>
  );
}
