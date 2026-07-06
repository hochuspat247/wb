"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  ExternalLink,
  Grid3x3,
  Home,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { CardGenerator } from "@/components/CardGenerator";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { base64ToDataUrl, downloadBase64Image, downloadImageFromUrl } from "@/lib/image";
import { getProfile, saveProfile } from "@/lib/profile";
import { clearHistory, getHistory, removeFromHistory } from "@/lib/storage";
import type { ProductCardResult } from "@/types/product-card";

type Tab = "dashboard" | "create" | "cards" | "settings";

function getThumbnail(card: ProductCardResult) {
  if (card.generatedImageUrl) return card.generatedImageUrl;
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType);
  }
  return card.generatedImageDataUrl || card.imageDataUrl || null;
}

function getPresetLabel(preset?: string) {
  if (preset === "luxury-catalog") return "Luxury Catalog";
  if (preset === "standard") return "Standard";
  if (preset === "premium-marketplace") return "Premium";
  return null;
}

export function CabinetApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [cards, setCards] = useState<ProductCardResult[]>([]);
  const [profileName, setProfileName] = useState("Продавец");
  const [editName, setEditName] = useState("Продавец");
  const [selected, setSelected] = useState<ProductCardResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setCards(getHistory());
    const profile = getProfile();
    setProfileName(profile.name);
    setEditName(profile.name);

    if (window.location.hash === "#create") {
      setTab("create");
    }
  }, []);

  function refreshCards() {
    setCards(getHistory());
  }

  function openCreateTab() {
    setTab("create");
    setSidebarOpen(false);
    window.history.replaceState(null, "", "/cabinet#create");
  }

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = cards.filter((c) => new Date(c.generatedAt).getTime() > weekAgo).length;
    const marketplaces = new Set(cards.map((c) => c.marketplace)).size;
    const premium = cards.filter((c) => c.designPreset === "premium-marketplace" || c.designPreset === "luxury-catalog").length;

    return { total: cards.length, thisWeek, marketplaces, premium };
  }, [cards]);

  function handleRemove(id: string) {
    setCards(removeFromHistory(id));
    if (selected?.id === id) setSelected(null);
  }

  function handleClearAll() {
    clearHistory();
    setCards([]);
    setSelected(null);
  }

  function handleSaveProfile() {
    const saved = saveProfile({ name: editName });
    setProfileName(saved.name);
    setTab("dashboard");
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

  const nav = [
    { id: "dashboard" as const, label: "Обзор", icon: LayoutDashboard },
    { id: "create" as const, label: "Создать карточку", icon: Wand2 },
    { id: "cards" as const, label: "Мои карточки", icon: Grid3x3 },
    { id: "settings" as const, label: "Настройки", icon: Settings }
  ];

  const tabTitles: Record<Tab, string> = {
    dashboard: `Привет, ${profileName}!`,
    create: "Создать карточку",
    cards: "Мои карточки",
    settings: "Настройки"
  };

  return (
    <div className="cabinet-bg flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/8 bg-[#0d0d14]/95 p-6 backdrop-blur-2xl transition-transform duration-500 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo href="/" light />
          <button className="text-white/50 lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-10 grid gap-1">
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
          <Link className="cabinet-sidebar-link mt-2" href="/">
            <Home size={18} />
            На главную
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/8 bg-gradient-to-br from-violet/20 to-coral/10 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">Создать новую</p>
          <p className="mt-2 text-sm font-semibold text-white/80">Премиум-карточка за 2 минуты</p>
          <Button className="btn-glow mt-4 w-full shadow-glow" onClick={openCreateTab} type="button">
            <Plus size={16} />
            Новая карточка
          </Button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          aria-label="Закрыть"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-[#0a0a0f]/80 px-5 py-4 backdrop-blur-2xl lg:px-10">
          <div className="flex items-center gap-4">
            <button className="text-white lg:hidden" onClick={() => setSidebarOpen(true)} type="button">
              <LayoutDashboard size={22} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Личный кабинет</p>
          <p className="text-lg font-black text-white">{tabTitles[tab]}</p>
            </div>
          </div>
          <Button className="btn-glow hidden shadow-glow sm:inline-flex" onClick={openCreateTab} type="button">
            <Sparkles size={16} />
            Создать
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-10">
          {/* Dashboard */}
          {tab === "dashboard" ? (
            <div className="animate-scale-in space-y-8">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet/25 via-ink-soft to-coral/15 p-8 md:p-10">
                <div className="glow-orb -right-10 -top-10 h-48 w-48 bg-mint/20" />
                <div className="relative z-10">
                  <p className="text-sm font-bold text-mint">Добро пожаловать обратно</p>
                  <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
                    Ваш <span className="gradient-text-light">AI-студия</span> карточек
                  </h1>
                  <p className="mt-3 max-w-lg text-white/60">
                    Здесь хранятся все сохранённые карточки. Создавайте премиум-креативы и публикуйте на маркетплейсах.
                  </p>
                  <button className="mt-6 inline-flex items-center gap-2 font-bold text-mint transition hover:gap-3" onClick={openCreateTab} type="button">
                    Создать новую карточку <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Всего карточек", value: stats.total, icon: Grid3x3, color: "text-coral" },
                  { label: "За неделю", value: stats.thisWeek, icon: TrendingUp, color: "text-mint" },
                  { label: "Маркетплейсов", value: stats.marketplaces, icon: Zap, color: "text-sky" },
                  { label: "Премиум", value: stats.premium, icon: Sparkles, color: "text-violet" }
                ].map((stat, i) => (
                  <div
                    className="stat-card rounded-2xl p-6"
                    key={stat.label}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <stat.icon className={`${stat.color} mb-3`} size={22} />
                    <p className="text-4xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-sm font-semibold text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">Последние карточки</h2>
                  {cards.length > 0 ? (
                    <button className="text-sm font-bold text-mint" onClick={() => setTab("cards")} type="button">
                      Все →
                    </button>
                  ) : null}
                </div>
                {cards.length === 0 ? <EmptyState onCreate={openCreateTab} /> : <CardGrid cards={cards.slice(0, 4)} onOpen={setSelected} onRemove={handleRemove} />}
              </div>
            </div>
          ) : null}

          {/* Create tab */}
          {tab === "create" ? (
            <div className="animate-scale-in">
              <CardGenerator embedded hideHistory onSaved={refreshCards} />
            </div>
          ) : null}

          {/* Cards tab */}
          {tab === "cards" ? (
            <div className="animate-scale-in space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Мои карточки</h2>
                  <p className="mt-1 text-sm text-white/50">{cards.length} сохранённых результатов</p>
                </div>
                {cards.length > 0 ? (
                  <Button onClick={handleClearAll} variant="ghost">
                    <Trash2 size={16} />
                    Очистить всё
                  </Button>
                ) : null}
              </div>
              {cards.length === 0 ? <EmptyState onCreate={openCreateTab} /> : <CardGrid cards={cards} onOpen={setSelected} onRemove={handleRemove} />}
            </div>
          ) : null}

          {/* Settings */}
          {tab === "settings" ? (
            <div className="animate-scale-in max-w-lg space-y-6">
              <div className="glass-dark rounded-3xl p-8">
                <h2 className="text-xl font-black text-white">Профиль</h2>
                <p className="mt-2 text-sm text-white/50">Как к вам обращаться в кабинете</p>
                <label className="mt-6 grid gap-2 text-sm font-bold text-white/80">
                  Имя
                  <Input
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ваше имя"
                    value={editName}
                  />
                </label>
                <Button className="mt-6" onClick={handleSaveProfile}>
                  Сохранить
                </Button>
              </div>
              <div className="glass-dark rounded-3xl p-8">
                <h2 className="text-xl font-black text-white">Хранилище</h2>
                <p className="mt-2 text-sm text-white/50">Карточки хранятся локально в вашем браузере</p>
                <p className="mt-4 text-3xl font-black text-mint">{cards.length} / 10</p>
                <p className="text-xs text-white/40">максимум карточек в истории</p>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Detail modal */}
      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center">
          <div className="animate-scale-in w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#12121a] shadow-premium">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <h3 className="font-black text-white">{selected.headline || selected.title}</h3>
              <button className="text-white/50 hover:text-white" onClick={() => setSelected(null)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl bg-white/5">
                {getThumbnail(selected) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="aspect-[4/5] w-full object-cover" src={getThumbnail(selected)!} />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center text-white/30">Нет изображения</div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-coral/20 px-3 py-1 text-xs font-bold text-coral">{selected.marketplace}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">{selected.style}</span>
                  {getPresetLabel(selected.designPreset) ? (
                    <span className="rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-mint">
                      {getPresetLabel(selected.designPreset)}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-white/60">{selected.shortDescription}</p>
                {selected.price ? <p className="text-2xl font-black text-white">{selected.price}</p> : null}
                <p className="text-xs text-white/30">
                  {new Date(selected.generatedAt).toLocaleString("ru-RU")}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => handleDownload(selected)}>
                    <Download size={16} />
                    Скачать
                  </Button>
                  <Button onClick={openCreateTab} variant="secondary">
                    <ExternalLink size={16} />
                    Создать похожую
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass-dark flex flex-col items-center rounded-3xl px-8 py-16 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse-glow rounded-full bg-violet/30 blur-xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet to-coral">
          <Sparkles className="text-white" size={32} />
        </div>
      </div>
      <h3 className="text-xl font-black text-white">Пока нет карточек</h3>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        Создайте первую карточку во вкладке «Создать карточку» и нажмите «Сохранить» — она появится здесь.
      </p>
      <Button className="btn-glow mt-8 shadow-glow" onClick={onCreate} type="button">
          <Plus size={16} />
        Создать первую карточку
      </Button>
    </div>
  );
}

type CardGridProps = {
  cards: ProductCardResult[];
  onOpen: (card: ProductCardResult) => void;
  onRemove: (id: string) => void;
};

function CardGrid({ cards, onOpen, onRemove }: CardGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, i) => {
        const thumb = getThumbnail(card);
        const preset = getPresetLabel(card.designPreset);

        return (
          <div
            className="card-tile group cursor-pointer rounded-2xl"
            key={card.id}
            onClick={() => onOpen(card)}
            role="button"
            style={{ animationDelay: `${i * 0.08}s` }}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpen(card)}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="card-tile-img h-full w-full object-cover" src={thumb} />
              ) : (
                <div className="grid h-full place-items-center text-white/20">
                  <Grid3x3 size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                <p className="font-bold text-white">{card.headline || card.title}</p>
                <p className="text-xs text-white/60">{card.marketplace}</p>
              </div>
              {preset ? (
                <span className="absolute right-3 top-3 rounded-full bg-mint/90 px-2.5 py-1 text-[10px] font-black text-ink">
                  {preset}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="truncate text-sm font-bold text-white">{card.title}</p>
                <p className="text-xs text-white/40">
                  {new Date(card.generatedAt).toLocaleDateString("ru-RU")}
                  {card.price ? ` · ${card.price}` : ""}
                </p>
              </div>
              <button
                className="rounded-xl p-2 text-white/30 transition hover:bg-white/10 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(card.id);
                }}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
