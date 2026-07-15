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
  Store,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { NanoBananaRetentionNotice } from "@/components/NanoBananaRetentionNotice";
import { CardGenerator } from "@/components/CardGenerator";
import { VideoFromCardFlow, type VideoFlowPhase } from "@/components/video/VideoFromCardFlow";
import { VideoHistorySection } from "@/components/video/VideoHistorySection";
import { CardSavedVideosPanel } from "@/components/video/CardSavedVideosPanel";
import { CompareSection } from "@/components/CompareSection";
import { HistorySection } from "@/components/HistorySection";
import { Logo } from "@/components/Logo";
import { PaymentButton } from "@/components/PaymentButton";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { WildberriesConnectGuide } from "@/components/wildberries/WildberriesConnectGuide";
import { WildberriesCabinetSection } from "@/components/wildberries/WildberriesCabinetSection";
import { WildberriesPublishPanel } from "@/components/wildberries/WildberriesPublishPanel";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { GUEST_ID_KEY, INTENDED_GENERATION_KEY, CABINET_DEMO_HINT_DISMISSED_KEY } from "@/lib/guest";
import { CabinetDemoWelcomeHint } from "@/components/cabinet/CabinetDemoWelcomeHint";
import { CabinetExamplesSection } from "@/components/cabinet/CabinetExamplesSection";
import { PromoCodeForm } from "@/components/promo/PromoCodeForm";
import { downloadCardImageAsset } from "@/lib/client/cardImage";
import { applyDownloadPolicyToCard, canDownloadCardImage, type DownloadPolicy } from "@/lib/client/watermarkPolicy";
import { downloadBase64Image, downloadImageFromUrl, getGeneratedCoverSrc } from "@/lib/image";
import { DEFAULT_IMAGE_SETTINGS, getImageSettings, saveImageSettings, type ImageSettings } from "@/lib/imageSettings";
import { reachGoal } from "@/lib/metrika";
import { getSeriesSiblingCards } from "@/lib/series/plan";
import {
  FREE_TRIAL_CARDS,
  KIT_SERIES_DESCRIPTION,
  KIT_UNLOCK_CTA,
  PLAN_SKU_KIT_NAME,
  SKU_KIT_SLIDE_COUNT,
  calculatePackagePrice,
  formatCabinetQuotaBanner,
  formatMonthlyFreeResetHint,
  formatRub,
  kitBuyCta
} from "@/lib/pricing";
import { clearHistory, getHistory } from "@/lib/storage";
import {
  disconnectWildberries,
  fetchWildberriesSettings,
  saveWildberriesSettings
} from "@/lib/api/wildberries";
import type { ProductCardResult } from "@/types/product-card";
import type { WildberriesIntegrationStatus } from "@/types/wildberries";

type Tab = "create" | "history" | "wildberries" | "examples" | "compare" | "settings";

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
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [downloadPolicy, setDownloadPolicy] = useState<DownloadPolicy | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);
  const [demoWelcomeHint, setDemoWelcomeHint] = useState<{ cardId: string; title?: string } | null>(null);
  const [wbStatus, setWbStatus] = useState<WildberriesIntegrationStatus>({
    connected: false,
    isSandbox: false
  });
  const [wbToken, setWbToken] = useState("");
  const [wbSandbox, setWbSandbox] = useState(false);
  const [wbMessage, setWbMessage] = useState("");
  const [wbSaving, setWbSaving] = useState(false);
  const [wildberriesUnlocked, setWildberriesUnlocked] = useState(false);
  const [monthlyFreeResetsAt, setMonthlyFreeResetsAt] = useState<string | null>(null);
  const [monthlyFreeRemaining, setMonthlyFreeRemaining] = useState<number | null>(null);

  const applyQuotaState = useCallback(
    (quota: {
      remaining: number;
      used?: number;
      credits?: number;
      cleanDownloadGenerationId?: string | null;
      downloadsFullyUnlocked?: boolean;
      wildberriesUnlocked?: boolean;
      unlimited?: boolean;
      monthlyFreeRemaining?: number;
      monthlyFreeResetsAt?: string | null;
    }) => {
      setRemainingGenerations(quota.remaining);
      setGenerationsUsed(quota.used ?? 0);
      setWildberriesUnlocked(Boolean(quota.wildberriesUnlocked || quota.unlimited));
      setMonthlyFreeRemaining(
        typeof quota.monthlyFreeRemaining === "number" ? quota.monthlyFreeRemaining : null
      );
      setMonthlyFreeResetsAt(quota.monthlyFreeResetsAt ?? null);
      setDownloadPolicy({
        cleanDownloadGenerationId: quota.cleanDownloadGenerationId ?? null,
        downloadsFullyUnlocked: Boolean(quota.downloadsFullyUnlocked)
      });
    },
    []
  );

  const handleQuotaChange = useCallback(
    (quota: Parameters<typeof applyQuotaState>[0]) => {
      applyQuotaState(quota);
    },
    [applyQuotaState]
  );

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

  const canDownloadSelected = selectedDisplayCard
    ? canDownloadCardImage(selectedDisplayCard, downloadPolicy, true)
    : false;

  const selectedSeriesCards = useMemo(() => {
    if (!selected) {
      return [];
    }

    return getSeriesSiblingCards(cards, selected);
  }, [cards, selected]);

  useEffect(() => {
    setImageSettings(getImageSettings());
  }, []);

  useEffect(() => {
    fetchWildberriesSettings()
      .then((status) => {
        setWbStatus(status);
        setWbSandbox(status.isSandbox);
      })
      .catch(() => {
        setWbStatus({ connected: false, isSandbox: false });
      });
  }, []);

  useEffect(() => {
    async function loadCabinet() {
      try {
        const fromDemoParam = searchParams.get("fromDemo");
        const fromDemoStored = window.localStorage.getItem(INTENDED_GENERATION_KEY);
        const fromDemoId = fromDemoParam || fromDemoStored || null;

        const [profile, remoteCards, quota] = await Promise.all([
          fetchUserProfile(),
          fetchUserCards(),
          fetchUserQuota().catch(() => null)
        ]);
        setProfileName(profile.name);
        setUserEmail(profile.email);
        setEditName(profile.name);
        setRemainingGenerations(quota?.remaining ?? profile.quota?.remaining ?? 0);
        setGenerationsUsed(quota?.used ?? profile.quota?.used ?? 0);
        if (quota) {
          applyQuotaState(quota);
        }
        setNeedsEmailVerification(Boolean(profile.needsEmailVerification));
        setEmailDisplay(profile.emailDisplay || profile.email);

        if (searchParams.get("verified") === "1" && !profile.needsEmailVerification) {
          setVerificationMessage("Email подтверждён. Можно генерировать карточки.");
        }

        let nextRemoteCards = remoteCards;
        const guestId = window.localStorage.getItem(GUEST_ID_KEY);

        if (guestId) {
          await migrateGuestGenerations(guestId).catch(() => 0);
          nextRemoteCards = await fetchUserCards();
        }

        const localCards = getHistory();
        if (localCards.length > 0 && nextRemoteCards.length === 0) {
          const migrated = await migrateLocalCards(localCards);
          setCards(migrated);
          clearHistory();
        } else {
          setCards(nextRemoteCards);
        }

        if (fromDemoId) {
          window.localStorage.removeItem(INTENDED_GENERATION_KEY);
          setTab("history");
          window.history.replaceState(null, "", "/cabinet#history");

          const demoCard =
            nextRemoteCards.find((card) => card.id === fromDemoId) ??
            (nextRemoteCards.length ? nextRemoteCards[nextRemoteCards.length - 1] : null);

          if (demoCard) {
            setSelected(demoCard);
            const hintDismissed = window.localStorage.getItem(CABINET_DEMO_HINT_DISMISSED_KEY) === "1";
            if (!hintDismissed) {
              setDemoWelcomeHint({ cardId: demoCard.id, title: demoCard.title });
            }
          }
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

    if (window.location.hash === "#history") {
      setTab("history");
    }

    if (window.location.hash === "#wildberries") {
      setTab("wildberries");
    }

    const pendingVideoOrder = searchParams.get("videoOrder");
    if (pendingVideoOrder) {
      setVideoOrderId(pendingVideoOrder);
      setTab("create");
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading || (tab !== "history" && tab !== "wildberries")) {
      return;
    }

    refreshCards();
  }, [loading, tab]);

  function dismissDemoWelcomeHint() {
    window.localStorage.setItem(CABINET_DEMO_HINT_DISMISSED_KEY, "1");
    setDemoWelcomeHint(null);
  }

  function openDemoWelcomeCard() {
    const card = cards.find((item) => item.id === demoWelcomeHint?.cardId);
    if (card) {
      setSelected(card);
      setTab("history");
    }
    dismissDemoWelcomeHint();
  }

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

  function openSettingsTab() {
    setSelected(null);
    setTab("settings");
    window.history.replaceState(null, "", "/cabinet#settings");
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

  async function handleSaveWildberries() {
    setWbSaving(true);
    setWbMessage("");

    try {
      const status = await saveWildberriesSettings({ token: wbToken, isSandbox: wbSandbox });
      setWbStatus(status);
      setWbToken("");
      setWbMessage("WB API подключен. Теперь карточки можно отправлять в личный кабинет WB.");
    } catch (caught) {
      setWbMessage(caught instanceof Error ? caught.message : "Не удалось подключить WB API.");
    } finally {
      setWbSaving(false);
    }
  }

  async function handleDisconnectWildberries() {
    setWbSaving(true);
    setWbMessage("");

    try {
      const status = await disconnectWildberries();
      setWbStatus(status);
      setWbSandbox(false);
      setWbToken("");
      setWbMessage("WB API отключен.");
    } catch (caught) {
      setWbMessage(caught instanceof Error ? caught.message : "Не удалось отключить WB API.");
    } finally {
      setWbSaving(false);
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

    if (!canDownloadCardImage(displayCard, downloadPolicy, true)) {
      return;
    }

    const result = await downloadCardImageAsset(displayCard, "marketcard-ai.png");

    if (result.blocked) {
      return;
    }

    if (!result.missing) {
      return;
    }

    const coverSrc = getGeneratedCoverSrc(displayCard);

    if (coverSrc?.startsWith("data:")) {
      await downloadImageFromUrl(coverSrc, "marketcard-ai.png");
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
    history: "История карточек",
    wildberries: "Wildberries",
    examples: "Примеры карточек",
    compare: "Сравнение с альтернативами",
    settings: "Настройки"
  };

  const tabTitlesMobile: Record<Tab, string> = {
    create: "Создать карточку",
    history: "История",
    wildberries: "WB",
    examples: "Примеры",
    compare: "Сравнение",
    settings: "Настройки"
  };

  const nav = [
    { id: "create" as const, label: "Создать", shortLabel: "Создать", icon: Wand2 },
    { id: "history" as const, label: "История", shortLabel: "История", icon: History },
    { id: "wildberries" as const, label: "Wildberries", shortLabel: "WB", icon: Store, accent: "wb" as const },
    { id: "examples" as const, label: "Примеры", shortLabel: "Примеры", icon: ImageIcon },
    { id: "compare" as const, label: "Сравнение", shortLabel: "Сравн.", icon: Scale },
    { id: "settings" as const, label: "Настройки", shortLabel: "Ещё", icon: Settings }
  ];
  const isQuotaExhausted = remainingGenerations < 999_000 && remainingGenerations === 0;
  const skuKit = calculatePackagePrice(SKU_KIT_SLIDE_COUNT);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-clay bg-card p-5 text-ink lg:flex">
        <Logo href="/cabinet" />
        <div className="mt-8 rounded-[22px] border border-clay bg-sand p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Баланс</p>
          <p className="mt-3 text-3xl font-black text-ink">
            {remainingGenerations >= 999_000 ? "Безлимит" : remainingGenerations}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {isQuotaExhausted
              ? "пробные карточки использованы"
              : monthlyFreeRemaining !== null
                ? `${monthlyFreeRemaining} из ${FREE_TRIAL_CARDS} ${FREE_TRIAL_CARDS === 1 ? "пробной карточки" : "пробных карточек"} с меткой`
                : "пробных карточек доступно"}
          </p>
          {isQuotaExhausted ? (
            <PaymentButton className="mt-4" count={SKU_KIT_SLIDE_COUNT} metrikaPlan="cabinet_sidebar_sku_kit" size="sm">
              {kitBuyCta()}
            </PaymentButton>
          ) : (
            <CabinetPricingLink className="mt-4 w-full" />
          )}
        </div>
        <nav className="mt-6 grid gap-1">
          {nav.map((item) => (
            <button
              className={`cabinet-sidebar-link ${
                tab === item.id ? (item.accent === "wb" ? "active-wb" : "active") : ""
              }`}
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
            <div className="rounded-full border border-clay bg-card px-2.5 py-1 text-xs font-bold sm:hidden">
              {remainingGenerations >= 999_000 ? (
                "∞"
              ) : isQuotaExhausted ? (
                <Link className="text-accent-ink" href="/#pricing">
                  Купить комплект
                </Link>
              ) : (
                <span className="text-accent-ink">{remainingGenerations}</span>
              )}
            </div>
            <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-clay bg-card px-4 py-2 text-sm font-bold text-muted">
              ИИ: {imageSettings.imageMode}
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
            <div className="mb-6 rounded-[18px] border border-mint/25 bg-mint/10 px-4 py-3 text-sm font-semibold text-accent-ink">
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
              {isQuotaExhausted ? (
                <div className="flex flex-col gap-3 rounded-[16px] border border-accent/30 bg-accent/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[18px] sm:px-4 sm:py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">Пробные карточки с водяным знаком использованы</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-muted sm:text-sm">
                      {formatMonthlyFreeResetHint(monthlyFreeResetsAt)} {KIT_SERIES_DESCRIPTION} — в комплекте «
                      {PLAN_SKU_KIT_NAME}» за {formatRub(skuKit.total)}. Разовая оплата, без подписки.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <PaymentButton
                      className="w-full sm:w-auto"
                      count={SKU_KIT_SLIDE_COUNT}
                      metrikaPlan="cabinet_quota_banner_sku_kit"
                      size="sm"
                    >
                      {KIT_UNLOCK_CTA}
                    </PaymentButton>
                    <CabinetPricingLink className="self-start sm:self-auto" onLight />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-[16px] border border-mint/20 bg-mint/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[18px] sm:px-4 sm:py-3">
                  <p className="text-xs font-bold text-accent-ink sm:text-sm">
                    {formatCabinetQuotaBanner({
                      remaining: remainingGenerations,
                      unlimited: remainingGenerations >= 999_000,
                      monthlyFreeRemaining: monthlyFreeRemaining ?? undefined,
                      monthlyFreeResetsAt
                    })}
                  </p>
                  <CabinetPricingLink className="self-start sm:self-auto" onLight />
                </div>
              )}
              <CardGenerator
                embedded
                hideHistory
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
              {isQuotaExhausted ? (
                <div className="flex flex-col gap-3 rounded-[16px] border border-accent/30 bg-accent/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[18px] sm:px-4 sm:py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">Пробные карточки с водяным знаком использованы</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-muted sm:text-sm">
                      {formatMonthlyFreeResetHint(monthlyFreeResetsAt)} {KIT_SERIES_DESCRIPTION} — купите комплект, чтобы
                      скачать без метки. Уже созданные карточки с водяным знаком остаются в истории.
                    </p>
                  </div>
                  <PaymentButton
                    className="w-full sm:w-auto"
                    count={SKU_KIT_SLIDE_COUNT}
                    metrikaPlan="cabinet_history_sku_kit"
                    size="sm"
                  >
                    {KIT_UNLOCK_CTA}
                  </PaymentButton>
                </div>
              ) : null}
              {demoWelcomeHint ? (
                <CabinetDemoWelcomeHint
                  cardTitle={demoWelcomeHint.title}
                  onDismiss={dismissDemoWelcomeHint}
                  onOpenCard={openDemoWelcomeCard}
                />
              ) : null}
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
                <EmptyState
                  generationsUsed={generationsUsed}
                  isQuotaExhausted={isQuotaExhausted}
                  monthlyFreeResetsAt={monthlyFreeResetsAt}
                  onCreate={openCreateTab}
                  remainingGenerations={remainingGenerations}
                  skuKitTotal={skuKit.total}
                />
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

          {tab === "wildberries" ? (
            <WildberriesCabinetSection
              cards={cards}
              onCardsRefresh={refreshCards}
              onGenerateMore={openCreateTab}
              onNeedConnect={openSettingsTab}
              onOpenCard={(card) => {
                setSelected(card);
                setTab("history");
              }}
              onQuotaChange={handleQuotaChange}
              wbConnected={wbStatus.connected}
              wbUnlocked={wildberriesUnlocked}
            />
          ) : null}

          {tab === "examples" ? (
            <CabinetExamplesSection />
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Wildberries API</h2>
                    <p className="mt-1 text-sm text-muted">
                      Подключите токен с категорией Content. Публикация карточек из истории доступна с тарифа «Комплект для одного товара».
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      wbStatus.connected ? "bg-mint/15 text-accent-ink" : "bg-paper text-muted"
                    }`}
                  >
                    {wbStatus.connected ? "Подключено" : "Не подключено"}
                  </span>
                </div>
                <WildberriesBetaNotice className="mt-4" compact />
                <WildberriesConnectGuide className="mt-5" compact onOpenSettings={openSettingsTab} />
                <label className="mt-5 grid gap-2 text-sm font-semibold text-ink">
                  WB API-токен
                  <Input
                    autoComplete="off"
                    onChange={(event) => setWbToken(event.target.value)}
                    placeholder={wbStatus.connected ? "Вставьте новый токен, чтобы заменить текущий" : "eyJhbGciOi..."}
                    type="password"
                    value={wbToken}
                  />
                </label>
                <Checkbox
                  checked={wbSandbox}
                  className="mt-3"
                  label="Использовать sandbox WB"
                  onChange={(event) => setWbSandbox(event.target.checked)}
                />
                {wbStatus.updatedAt ? (
                  <p className="mt-3 text-xs font-semibold text-muted">
                    Обновлено: {new Date(wbStatus.updatedAt).toLocaleString("ru-RU")}
                  </p>
                ) : null}
                {wbStatus.lastError ? (
                  <p className="mt-3 text-xs font-semibold text-red-500">{wbStatus.lastError}</p>
                ) : null}
                {wbMessage ? <p className="mt-3 text-xs font-semibold text-muted">{wbMessage}</p> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button disabled={wbSaving || !wbToken.trim()} onClick={() => void handleSaveWildberries()} size="sm">
                    {wbSaving ? "Проверяем..." : wbStatus.connected ? "Заменить токен" : "Подключить WB"}
                  </Button>
                  {wbStatus.connected ? (
                    <Button
                      disabled={wbSaving}
                      onClick={() => void handleDisconnectWildberries()}
                      size="sm"
                      variant="ghost"
                    >
                      Отключить
                    </Button>
                  ) : null}
                </div>
                <p className="mt-4 text-xs font-semibold leading-relaxed text-muted">
                  Токен хранится в зашифрованном виде. Пароль от личного кабинета WB здесь не нужен.
                </p>
              </Card>

              <Card padding="lg">
                <h2 className="text-lg font-bold text-ink">ИИ-провайдер изображений</h2>
                <p className="mt-1 text-sm text-muted">Обложки генерируются через NanoBanana Expert</p>
                <NanoBananaRetentionNotice className="mt-3" />
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
                      value={imageSettings.imageProvider === "gemini" ? "nanobanana_expert" : imageSettings.imageProvider}
                    >
                      <option value="nanobanana_expert">NanoBanana Expert</option>
                      <option value="auto">Авто</option>
                    </Select>
                  </label>
                </div>
                <Button className="mt-5" onClick={handleSaveImageSettings} size="sm">
                  Сохранить настройки
                </Button>
              </Card>

              <Card padding="lg">
                <PromoCodeForm
                  product="marketcard"
                  onSuccess={(result) => handleQuotaChange(result.quota)}
                />
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 gap-0.5 border-t border-clay bg-card/95 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {nav.map((item) => (
          <button
            aria-label={item.label}
            className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[12px] px-0.5 py-2 ${
              tab === item.id
                ? item.accent === "wb"
                  ? "bg-[#CB11AB] text-white"
                  : "bg-accent text-on-accent"
                : "text-muted"
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
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          className="w-full"
                          disabled={!canDownloadSelected}
                          onClick={() => handleDownload(selected!)}
                          size="sm"
                        >
                          <Download size={16} />
                          Скачать PNG
                        </Button>
                        <Button className="w-full" onClick={openCreateTab} size="sm" variant="secondary">
                          <ExternalLink size={16} />
                          Создать похожую
                        </Button>
                      </div>
                      <CardSavedVideosPanel card={selected} compact />
                      <WildberriesPublishPanel
                        card={selected}
                        compact
                        historyCards={cards}
                        onCardsGenerated={refreshCards}
                        onNeedConnect={openSettingsTab}
                        onQuotaChange={handleQuotaChange}
                        relatedCards={selectedSeriesCards}
                        wbConnected={wbStatus.connected}
                        wbUnlocked={wildberriesUnlocked}
                      />
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

function EmptyState({
  onCreate,
  generationsUsed,
  remainingGenerations,
  isQuotaExhausted,
  skuKitTotal,
  monthlyFreeResetsAt
}: {
  onCreate: () => void;
  generationsUsed: number;
  remainingGenerations: number;
  isQuotaExhausted: boolean;
  skuKitTotal: number;
  monthlyFreeResetsAt?: string | null;
}) {
  const lostGeneration = generationsUsed > 0 && !isQuotaExhausted;

  return (
    <Card className="flex flex-col items-center py-16 text-center" padding="lg">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-card bg-paper text-ink">
        <Wand2 size={24} />
      </div>
      <h3 className="text-xl font-bold text-ink">
        {isQuotaExhausted
          ? "История пуста"
          : lostGeneration
            ? "Карточка не попала в историю"
            : "Пока нет карточек"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {isQuotaExhausted ? (
          <>
            Пробные карточки с водяным знаком уже использованы. {formatMonthlyFreeResetHint(monthlyFreeResetsAt)}{" "}
            Купите комплект за {formatRub(skuKitTotal)} — {KIT_SERIES_DESCRIPTION.toLowerCase()} без метки.
          </>
        ) : lostGeneration ? (
          <>
            Похоже, одна из пробных карточек уже списалась, но результат не сохранился. Создайте карточку ещё раз — у вас
            осталось {remainingGenerations} из {generationsUsed + remainingGenerations} пробных карточек.
          </>
        ) : (
          "Создайте первую карточку на вкладке «Создать» — после сохранения она появится в этой истории."
        )}
      </p>
      {isQuotaExhausted ? (
        <PaymentButton className="mt-8" count={SKU_KIT_SLIDE_COUNT} metrikaPlan="cabinet_history_empty_sku_kit">
          {KIT_UNLOCK_CTA}
        </PaymentButton>
      ) : (
        <Button className="mt-8" onClick={onCreate} type="button">
          <Plus size={16} />
          {lostGeneration ? "Создать карточку снова" : "Создать первую карточку"}
        </Button>
      )}
    </Card>
  );
}
