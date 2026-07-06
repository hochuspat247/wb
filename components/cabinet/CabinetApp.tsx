"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  History,
  ImageIcon,
  Menu,
  Plus,
  Settings,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { CardGenerator } from "@/components/CardGenerator";
import { HistorySection } from "@/components/HistorySection";
import { Logo } from "@/components/Logo";
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
import { base64ToDataUrl, downloadBase64Image, downloadImageFromUrl } from "@/lib/image";
import { getImageSettings, saveImageSettings, type ImageSettings } from "@/lib/imageSettings";
import { clearHistory, getHistory } from "@/lib/storage";
import type { ProductCardResult } from "@/types/product-card";

type Tab = "create" | "history" | "examples" | "settings";

function getThumbnail(card: ProductCardResult) {
  if (card.generatedImageUrl) return card.generatedImageUrl;
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType);
  }
  return card.generatedImageDataUrl || card.imageDataUrl || null;
}

export function CabinetApp() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("create");
  const [cards, setCards] = useState<ProductCardResult[]>([]);
  const [profileName, setProfileName] = useState("Продавец");
  const [userEmail, setUserEmail] = useState("");
  const [editName, setEditName] = useState("Продавец");
  const [selected, setSelected] = useState<ProductCardResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(getImageSettings());

  useEffect(() => {
    async function loadCabinet() {
      try {
        const [profile, remoteCards] = await Promise.all([fetchUserProfile(), fetchUserCards()]);
        setProfileName(profile.name);
        setUserEmail(profile.email);
        setEditName(profile.name);

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
  }

  function openCreateTab() {
    setTab("create");
    setSidebarOpen(false);
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
    if (card.generatedImageUrl) {
      await downloadImageFromUrl(card.generatedImageUrl, "marketcard-ai.png");
      return;
    }
    if (card.generatedImageBase64 && card.generatedImageMimeType) {
      downloadBase64Image(card.generatedImageBase64, card.generatedImageMimeType, "marketcard-ai.png");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader label="Загружаем кабинет…" />
      </div>
    );
  }

  const nav = [
    { id: "create" as const, label: "Создать карточку", icon: Wand2 },
    { id: "history" as const, label: "История", icon: History },
    { id: "examples" as const, label: "Примеры", icon: ImageIcon },
    { id: "settings" as const, label: "Настройки", icon: Settings }
  ];

  const tabTitles: Record<Tab, string> = {
    create: "Создать карточку",
    history: "История генераций",
    examples: "Примеры карточек",
    settings: "Настройки"
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-clay bg-card p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button className="text-muted lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 grid gap-1">
          {nav.map((item) => (
            <button
              className={`cabinet-sidebar-link ${tab === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              type="button"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <Link className="cabinet-sidebar-link mt-4" href="/">
            <ArrowLeft size={18} />
            Вернуться на сайт
          </Link>
        </nav>

        <div className="mt-auto rounded-card border border-clay bg-paper p-4">
          <p className="text-xs font-semibold text-muted">Карточек сохранено</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats.total}</p>
          <Button className="mt-4 w-full" onClick={openCreateTab} size="sm">
            <Plus size={16} />
            Новая карточка
          </Button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          aria-label="Закрыть"
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-clay bg-card/90 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <button className="text-ink lg:hidden" onClick={() => setSidebarOpen(true)} type="button">
              <Menu size={22} />
            </button>
            <div>
              <p className="text-xs font-medium text-muted">Рабочий кабинет</p>
              <p className="text-lg font-bold text-ink">{tabTitles[tab]}</p>
            </div>
          </div>
          <p className="hidden text-sm text-muted sm:block">{profileName}</p>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {tab === "create" ? (
            <CardGenerator embedded hideHistory onSaved={refreshCards} persistToServer />
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
                <>
                  <HistorySection
                    history={cards}
                    onClear={handleClearAll}
                    onOpen={setSelected}
                    onRemove={handleRemove}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => {
                      const thumb = getThumbnail(card);
                      return (
                        <Card
                          className="cursor-pointer overflow-hidden p-0 transition hover:-translate-y-0.5"
                          hover
                          key={card.id}
                          padding="none"
                        >
                          <button className="w-full text-left" onClick={() => setSelected(card)} type="button">
                            <div className="aspect-[4/5] bg-paper">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" className="h-full w-full object-cover" src={thumb} />
                              ) : (
                                <div className="grid h-full place-items-center text-sm text-muted">Нет превью</div>
                              )}
                            </div>
                            <div className="p-4">
                              <p className="truncate font-semibold text-ink">{card.title}</p>
                              <p className="mt-1 text-xs text-muted">
                                {card.marketplace} · {new Date(card.generatedAt).toLocaleDateString("ru-RU")}
                              </p>
                            </div>
                          </button>
                        </Card>
                      );
                    })}
                  </div>
                </>
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
                <p className="mt-2 text-sm text-muted">{userEmail || session?.user?.email}</p>
                <Button className="mt-5" onClick={() => signOut({ callbackUrl: "/" })} size="sm" variant="secondary">
                  Выйти из аккаунта
                </Button>
              </Card>
            </div>
          ) : null}
        </main>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
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
