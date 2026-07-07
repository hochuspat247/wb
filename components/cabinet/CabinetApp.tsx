"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { CompareSection } from "@/components/CompareSection";
import { HistorySection } from "@/components/HistorySection";
import { Logo } from "@/components/Logo";
import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import {
  clearUserCardsRemote,
  fetchUserCards,
  fetchUserProfile,
  migrateLocalCards,
  removeUserCardRemote,
  updateUserProfile
} from "@/lib/api/user";
import { downloadBase64Image, downloadImageFromUrl, getGeneratedCoverSrc } from "@/lib/image";
import { getImageSettings, saveImageSettings, type ImageSettings } from "@/lib/imageSettings";
import { reachGoal } from "@/lib/metrika";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";
import { clearHistory, getHistory } from "@/lib/storage";
import type { ProductCardResult } from "@/types/product-card";

type Tab = "create" | "history" | "examples" | "compare" | "settings";

function getThumbnail(card: ProductCardResult) {
  return getGeneratedCoverSrc(card) || card.imageDataUrl || null;
}

export function CabinetApp() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("create");
  const [cards, setCards] = useState<ProductCardResult[]>([]);
  const [profileName, setProfileName] = useState("Продавец");
  const [userEmail, setUserEmail] = useState("");
  const [editName, setEditName] = useState("Продавец");
  const [selected, setSelected] = useState<ProductCardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(getImageSettings());
  const [remainingGenerations, setRemainingGenerations] = useState(0);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");

  useEffect(() => {
    async function loadCabinet() {
      try {
        const [profile, remoteCards] = await Promise.all([fetchUserProfile(), fetchUserCards()]);
        setProfileName(profile.name);
        setUserEmail(profile.email);
        setEditName(profile.name);
        setRemainingGenerations(profile.quota?.remaining ?? 0);
        setNeedsEmailVerification(Boolean(profile.needsEmailVerification));
        setEmailDisplay(profile.emailDisplay || profile.email);

        const localCards = getHistory();
        if (localCards.length > 0 && remoteCards.length === 0) {
          const migrated = await migrateLocalCards(localCards);
          setCards(migrated);
          clearHistory();
        } else {
          setCards(remoteCards);
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
  }, []);

  function refreshCards() {
    fetchUserCards()
      .then(setCards)
      .catch(() => setCards(getHistory()));

    fetchUserProfile()
      .then((profile) => setRemainingGenerations(profile.quota?.remaining ?? 0))
      .catch(() => undefined);
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

  function handleSaveImageSettings() {
    saveImageSettings(imageSettings);
  }

  async function handleDownload(card: ProductCardResult) {
    if (card.generatedImageBase64 && card.generatedImageMimeType) {
      downloadBase64Image(card.generatedImageBase64, card.generatedImageMimeType, "marketcard-ai.png");
      return;
    }

    const coverSrc = getGeneratedCoverSrc(card);

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
          ) : null}
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

      <div className="flex min-h-screen flex-col">
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

        <main className="flex-1 overflow-y-auto px-3 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 sm:pb-28 lg:p-8">
          {needsEmailVerification ? (
            <div className="mb-6 rounded-[18px] border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
              Подтвердите email ({emailDisplay}) — проверьте почту после регистрации.
            </div>
          ) : null}

          {tab === "create" ? (
            <div className="space-y-4 sm:space-y-6">
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
              <p className="rounded-[16px] border border-mint/20 bg-mint/10 px-3 py-2.5 text-xs font-bold text-mint sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-sm">
                {remainingGenerations >= 999_000
                  ? "Безлимитные генерации для вашего аккаунта."
                  : `Стартовый оффер: ${FREE_TRIAL_CARDS} карточки бесплатно. Доступно: ${remainingGenerations}`}
              </p>
              <CardGenerator
                embedded
                hideHistory
                darkConsole
                onQuotaChange={(quota) => setRemainingGenerations(quota.remaining)}
                onSaved={refreshCards}
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
                  history={cards}
                  onClear={handleClearAll}
                  onOpen={setSelected}
                  onRemove={handleRemove}
                />
              )}
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
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <Card className="w-full max-w-2xl overflow-hidden p-0" padding="none">
            <div className="flex items-center justify-between border-b border-clay px-6 py-4">
              <h3 className="font-bold text-ink">{selected.headline || selected.title}</h3>
              <button className="text-muted hover:text-ink" onClick={() => setSelected(null)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-card bg-paper">
                {getThumbnail(selected) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="aspect-[4/5] w-full object-cover" src={getThumbnail(selected)!} />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center text-muted">Нет изображения</div>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  {selected.marketplace} · {selected.style}
                </p>
                <p className="text-sm leading-relaxed text-muted">{selected.shortDescription}</p>
                {selected.price ? <p className="text-2xl font-bold text-ink">{selected.price}</p> : null}
                <p className="text-xs text-muted">{new Date(selected.generatedAt).toLocaleString("ru-RU")}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => handleDownload(selected)} size="sm">
                    <Download size={16} />
                    Скачать PNG
                  </Button>
                  <Button onClick={openCreateTab} size="sm" variant="secondary">
                    <ExternalLink size={16} />
                    Создать похожую
                  </Button>
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
