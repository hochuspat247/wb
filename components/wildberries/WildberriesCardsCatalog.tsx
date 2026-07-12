"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Store,
  Trash2,
  X
} from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Textarea } from "@/components/ui/Textarea";
import {
  fetchWildberriesCard,
  fetchWildberriesCards,
  updateWildberriesCard
} from "@/lib/api/wildberries";
import { reachGoal } from "@/lib/metrika";
import { WB_INTEGRATION_MIN_PACKAGE, calculatePackagePrice, formatRub } from "@/lib/pricing";
import type { WildberriesCatalogCard } from "@/types/wildberries";

type WildberriesCardsCatalogProps = {
  wbConnected: boolean;
  wbUnlocked: boolean;
  onNeedConnect?: () => void;
};

type EditorState = {
  title: string;
  description: string;
  brand: string;
  length: string;
  width: string;
  height: string;
  weight: string;
};

function formatCharacteristicValue(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function cardToEditor(card: WildberriesCatalogCard): EditorState {
  return {
    title: card.title,
    description: card.description,
    brand: card.brand,
    length: card.dimensions ? String(card.dimensions.length) : "",
    width: card.dimensions ? String(card.dimensions.width) : "",
    height: card.dimensions ? String(card.dimensions.height) : "",
    weight: card.dimensions ? String(card.dimensions.weightBrutto) : ""
  };
}

export function WildberriesCardsCatalog({ wbConnected, wbUnlocked, onNeedConnect }: WildberriesCardsCatalogProps) {
  const starterPack = calculatePackagePrice(WB_INTEGRATION_MIN_PACKAGE);
  const [source, setSource] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<WildberriesCatalogCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<WildberriesCatalogCard | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState<{ updatedAt?: string; nmId?: number } | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadCards = useCallback(
    async (options: { append?: boolean; searchValue?: string; sourceValue?: "active" | "trash" } = {}) => {
      if (!wbUnlocked || !wbConnected) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await fetchWildberriesCards({
          search: options.searchValue ?? query,
          limit: 24,
          source: options.sourceValue ?? source,
          updatedAt: options.append ? cursor?.updatedAt : undefined,
          nmId: options.append ? cursor?.nmId : undefined
        });

        setCards((current) => (options.append ? [...current, ...result.cards] : result.cards));
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Не удалось загрузить карточки WB.");
        if (!options.append) {
          setCards([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [cursor?.nmId, cursor?.updatedAt, query, source, wbConnected, wbUnlocked]
  );

  useEffect(() => {
    if (wbUnlocked && wbConnected) {
      void loadCards();
    }
  }, [wbConnected, wbUnlocked, source]);

  async function openCard(card: WildberriesCatalogCard) {
    setMessage("");
    setSelected(card);
    setEditor(cardToEditor(card));

    try {
      const fresh = await fetchWildberriesCard(card.nmId);
      setSelected(fresh);
      setEditor(cardToEditor(fresh));
    } catch {
      // keep list version
    }
  }

  async function handleSave() {
    if (!selected || !editor) {
      return;
    }

    const length = Number(editor.length);
    const width = Number(editor.width);
    const height = Number(editor.height);
    const weight = Number(editor.weight);

    if (!editor.title.trim() || !editor.description.trim()) {
      setMessage("Заполните название и описание.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateWildberriesCard(selected.nmId, {
        vendorCode: selected.vendorCode,
        title: editor.title.trim(),
        description: editor.description.trim(),
        brand: editor.brand.trim() || "Нет бренда",
        kizMarked: selected.kizMarked,
        dimensions:
          Number.isFinite(length) && Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(weight)
            ? { length, width, height, weightBrutto: weight }
            : selected.dimensions,
        characteristics: selected.characteristics.map((item) => ({
          id: item.id,
          value: item.value
        })),
        sizes: selected.sizes
      });

      reachGoal("wb_publish", { action: "update", nmId: selected.nmId });
      setMessage("Изменения отправлены в WB. Синхронизация может занять до 30 минут.");
      await loadCards();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Не удалось сохранить карточку.");
    } finally {
      setSaving(false);
    }
  }

  if (!wbUnlocked) {
    return (
      <Card padding="lg">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/12 text-[#CB11AB]">
            <Store size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink">Карточки на Wildberries</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
              Просмотр и редактирование карточек с WB доступны с тарифа «Рост» — от {WB_INTEGRATION_MIN_PACKAGE}{" "}
              генераций ({formatRub(starterPack.total)}).
            </p>
            <PaymentButton className="mt-4" count={WB_INTEGRATION_MIN_PACKAGE} metrikaPlan="wb_catalog_pack5" size="sm">
              Открыть каталог WB
            </PaymentButton>
          </div>
        </div>
      </Card>
    );
  }

  if (!wbConnected) {
    return (
      <Card padding="lg">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#CB11AB]/12 text-[#CB11AB]">
            <Store size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink">Карточки на Wildberries</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
              Подключите WB API-токен, чтобы подтянуть активные карточки и карточки из корзины WB.
            </p>
            <Button className="mt-4" onClick={onNeedConnect} size="sm">
              Подключить WB API
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#CB11AB]">
              <Store size={18} />
              <p className="text-xs font-black uppercase tracking-[0.16em]">Каталог WB</p>
            </div>
            <h2 className="mt-2 text-2xl font-black text-ink">Карточки на Wildberries</h2>
            <p className="mt-1 text-sm font-semibold text-muted">
              Подтягиваем данные из вашего кабинета WB: активные карточки и удалённые в корзину.
            </p>
          </div>
          <Button disabled={loading} onClick={() => void loadCards()} size="sm" variant="secondary">
            <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
            Обновить
          </Button>
        </div>

        <WildberriesBetaNotice className="mt-4" compact />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по артикулу, nmID или названию"
              value={search}
            />
            <Button
              onClick={() => {
                setQuery(search.trim());
                void loadCards({ searchValue: search.trim() });
              }}
              size="sm"
              variant="secondary"
            >
              <Search size={16} />
              Найти
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSource("active")} size="sm" variant={source === "active" ? "dark" : "secondary"}>
              Активные
            </Button>
            <Button onClick={() => setSource("trash")} size="sm" variant={source === "trash" ? "dark" : "secondary"}>
              <Trash2 size={15} />
              В корзине
            </Button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}
      </Card>

      {loading && !cards.length ? (
        <div className="grid place-items-center py-16">
          <Loader label="Загружаем карточки WB…" />
        </div>
      ) : null}

      {!loading && !cards.length ? (
        <Card className="py-14 text-center" padding="lg">
          <p className="text-lg font-bold text-ink">
            {source === "trash" ? "В корзине WB пока пусто" : "Карточки WB не найдены"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {query ? "Попробуйте другой запрос." : "Опубликуйте первую карточку из истории или измените фильтр."}
          </p>
        </Card>
      ) : null}

      {cards.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <button
              className="overflow-hidden rounded-[20px] border border-clay bg-card text-left transition hover:border-[#CB11AB]/35 hover:shadow-[0_16px_40px_rgba(203,17,171,0.08)]"
              key={`${card.nmId}-${card.updatedAt}`}
              onClick={() => void openCard(card)}
              type="button"
            >
              <div className="relative aspect-[4/5] bg-paper">
                {card.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-full w-full object-cover" src={card.photoUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-semibold text-muted">Нет фото</div>
                )}
                {card.inTrash ? (
                  <span className="absolute left-2 top-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                    Корзина
                  </span>
                ) : null}
                {card.photoCount > 0 ? (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    {card.photoCount} фото
                  </span>
                ) : null}
              </div>
              <div className="space-y-1 p-4">
                <p className="line-clamp-2 text-sm font-black text-ink">{card.title || "Без названия"}</p>
                <p className="text-xs font-semibold text-muted">
                  {card.vendorCode} · nmID {card.nmId}
                </p>
                <p className="text-xs text-muted">{card.subjectName || "Категория WB"}</p>
                <p className="text-[11px] text-muted">
                  Обновлено: {new Date(card.updatedAt).toLocaleString("ru-RU")}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button disabled={loading} onClick={() => void loadCards({ append: true })} variant="secondary">
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Загрузить ещё
          </Button>
        </div>
      ) : null}

      {selected && editor ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <Card className="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden p-0" padding="none">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-clay px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#CB11AB]">
                  {selected.inTrash ? "Карточка в корзине WB" : "Редактирование карточки WB"}
                </p>
                <h3 className="mt-1 text-lg font-black text-ink">{selected.title || selected.vendorCode}</h3>
                <p className="mt-1 text-xs text-muted">
                  {selected.vendorCode} · nmID {selected.nmId}
                  {selected.subjectName ? ` · ${selected.subjectName}` : ""}
                </p>
              </div>
              <button
                aria-label="Закрыть"
                className="shrink-0 rounded-full p-1 text-muted transition hover:text-ink"
                onClick={() => {
                  setSelected(null);
                  setEditor(null);
                  setMessage("");
                }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[18px] border border-clay bg-paper">
                  {selected.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="aspect-[4/5] w-full object-cover" src={selected.photoUrl} />
                  ) : (
                    <div className="grid aspect-[4/5] place-items-center text-sm text-muted">Нет фото</div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="grid gap-1.5 text-xs font-black uppercase text-muted">
                    Название
                    <Input onChange={(event) => setEditor((value) => (value ? { ...value, title: event.target.value } : value))} value={editor.title} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-black uppercase text-muted">
                    Бренд
                    <Input onChange={(event) => setEditor((value) => (value ? { ...value, brand: event.target.value } : value))} value={editor.brand} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-black uppercase text-muted">
                    Описание
                    <Textarea
                      onChange={(event) =>
                        setEditor((value) => (value ? { ...value, description: event.target.value } : value))
                      }
                      rows={8}
                      value={editor.description}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      ["Длина, см", "length"],
                      ["Ширина, см", "width"],
                      ["Высота, см", "height"],
                      ["Вес, кг", "weight"]
                    ].map(([label, key]) => (
                      <label className="grid gap-1.5 text-xs font-black uppercase text-muted" key={key}>
                        {label}
                        <Input
                          onChange={(event) =>
                            setEditor((value) => (value ? { ...value, [key]: event.target.value } : value))
                          }
                          value={editor[key as keyof EditorState]}
                        />
                      </label>
                    ))}
                  </div>

                  {selected.characteristics.length ? (
                    <div className="rounded-[16px] border border-clay bg-paper/50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Характеристики WB</p>
                      <div className="mt-3 grid gap-2">
                        {selected.characteristics.map((item) => (
                          <div className="flex flex-wrap justify-between gap-2 text-sm" key={item.id}>
                            <span className="font-semibold text-ink">{item.name}</span>
                            <span className="text-muted">{formatCharacteristicValue(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selected.inTrash ? (
                    <p className="rounded-[14px] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-ink">
                      Карточка в корзине WB. Редактирование может не примениться, пока карточка не восстановлена в
                      кабинете Wildberries.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button disabled={saving || selected.inTrash} onClick={() => void handleSave()}>
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      {saving ? "Сохраняем..." : "Сохранить в WB"}
                    </Button>
                    <a
                      className="inline-flex min-h-9 items-center gap-2 rounded-button border border-clay bg-card px-4 text-sm font-semibold text-ink transition hover:border-[#CB11AB]/35"
                      href={`https://seller.wildberries.ru/`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink size={15} />
                      Открыть кабинет WB
                    </a>
                  </div>

                  {message ? (
                    <p className={`text-sm font-semibold ${message.includes("отправлены") ? "text-mint" : "text-muted"}`}>
                      {message.includes("отправлены") ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 size={15} />
                          {message}
                        </span>
                      ) : (
                        message
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
