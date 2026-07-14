import { ADMIN_PRODUCTS, type AdminProductId } from "@/lib/admin/products";
import { BRAND } from "@/lib/branding";
import { getAdminAnalytics } from "@/lib/server/analytics";
import { listAdminUsers } from "@/lib/server/adminUsers";
import { getActiveVisitors } from "@/lib/server/presence";
import { listPromoCodes } from "@/lib/server/promoCodes";

export const GPT_EXPORT_ANALYSIS_BRIEF = `Проанализируй этот отчёт как продуктовый аналитик SaaS-платформы.
Нужно: 1) оценить воронку и узкие места, 2) сегменты пользователей и повторные визиты,
3) качество демо/генераций и ошибки, 4) сравнить ${BRAND.marketCard}, ${BRAND.storyStudio} и ${BRAND.kvartovid},
5) дать 5–10 конкретных рекомендаций по росту конверсии и удержанию.`;

export type AdminGptExportPayload = Awaited<ReturnType<typeof buildAdminGptExport>>;

export async function buildAdminGptExport() {
  const exportedAt = new Date();

  const [marketcard, storystudio, kvartovid, users, promoCodes, presenceMarketcard, presenceStorystudio, presenceKvartovid] =
    await Promise.all([
      getAdminAnalytics("/", "marketcard"),
      getAdminAnalytics("/storystudio", "storystudio"),
      getAdminAnalytics("/kvartovid", "kvartovid"),
      listAdminUsers({ limit: 500, offset: 0 }),
      listPromoCodes({ limit: 200 }),
      getActiveVisitors("marketcard"),
      getActiveVisitors("storystudio"),
      getActiveVisitors("kvartovid")
    ]);

  return {
    exportedAt: exportedAt.toISOString(),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || null,
    analysisBrief: GPT_EXPORT_ANALYSIS_BRIEF,
    products: {
      marketcard,
      storystudio,
      kvartovid
    },
    users,
    promoCodes,
    livePresence: {
      marketcard: presenceMarketcard,
      storystudio: presenceStorystudio,
      kvartovid: presenceKvartovid
    }
  };
}

function formatDate(value: Date | string | number | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function truncate(value: string | null | undefined, max = 240) {
  if (!value) {
    return "—";
  }

  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max)}…`;
}

function linesFromRows(headers: string[], rows: string[][]) {
  if (!rows.length) {
    return "_Нет данных._\n";
  }

  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${header}\n${divider}\n${body}\n`;
}

function formatDaySeries(label: string, rows: Array<{ day: string; value: number }>) {
  if (!rows.length) {
    return `### ${label}\n_Нет данных._\n\n`;
  }

  const table = linesFromRows(
    ["День", "Значение"],
    rows.map((row) => [row.day, String(row.value)])
  );

  return `### ${label}\n${table}\n`;
}

function formatFunnel7d(steps: Array<{ label: string; count: number; fromPreviousPercent: number | null }>) {
  if (!steps.length) {
    return "_Воронка пуста._\n\n";
  }

  return (
    linesFromRows(
      ["Шаг", "Сессии", "Конверсия от пред."],
      steps.map((step) => [step.label, String(step.count), step.fromPreviousPercent == null ? "—" : `${step.fromPreviousPercent}%`])
    ) + "\n"
  );
}

function formatProductSection(productId: AdminProductId, stats: AdminGptExportPayload["products"]["marketcard"]) {
  const product = ADMIN_PRODUCTS[productId];

  const returningRows = stats.returningVisitors.map((visitor) => [
    visitor.kind === "registered" ? "Аккаунт" : "Гость",
    truncate(visitor.name || visitor.email || visitor.guestId || "—", 40),
    String(visitor.visitSessions),
    String(visitor.visitDays),
    formatDate(visitor.lastVisitAt)
  ]);

  const recentUserRows = stats.recentUsers.slice(0, 30).map((user) => [
    truncate(user.name || "—", 24),
    truncate(user.email, 32),
    user.authMethods,
    String(user.generationsUsed),
    formatDate(user.createdAt)
  ]);

  const demoRows = stats.recentDemos.slice(0, 25).map((demo) => [
    truncate(demo.title, 28),
    demo.status,
    truncate(demo.productDescription, 36),
    demo.generationRating ? String(demo.generationRating) : "—",
    formatDate(demo.createdAt)
  ]);

  const cardRows = stats.recentCards.slice(0, 25).map((card) => [
    truncate(card.title, 28),
    card.marketplace,
    card.category,
    card.generationRating ? String(card.generationRating) : "—",
    formatDate(card.createdAt)
  ]);

  const errorRows = stats.recentDemoErrors.slice(0, 20).map((item) => [
    truncate(item.message, 40),
    item.code || "—",
    truncate(item.path, 24),
    formatDate(item.createdAt)
  ]);

  const journeyRows = stats.userJourneys.slice(0, 20).map((journey) => [
    truncate(journey.sessionId, 12),
    journey.userId ? "auth" : "guest",
    String(journey.pageViews),
    String(journey.clicks),
    String(journey.conversions),
    truncate(journey.currentPathLabel || journey.paths.join(" → "), 36)
  ]);

  let extra = "";

  if (productId === "storystudio" && stats.storyStudio) {
    const storyRows = stats.storyStudio.recentStories.slice(0, 20).map((story) => [
      truncate(story.title, 28),
      story.status,
      String(story.charactersCount),
      String(story.chaptersCount),
      story.premiumMode ? "да" : "нет",
      formatDate(story.updatedAt)
    ]);

    extra += `### Истории\n${linesFromRows(
      ["Название", "Статус", "Персонажи", "Главы", "18+", "Обновлено"],
      storyRows
    )}\n`;
  }

  if (productId === "kvartovid" && stats.kvartovid) {
    const listingRows = stats.kvartovid.recentListings.slice(0, 20).map((listing) => [
      truncate(listing.title, 28),
      listing.city,
      listing.rooms,
      listing.hasCover ? "да" : "нет",
      formatDate(listing.updatedAt)
    ]);

    extra += `### Объявления\n${linesFromRows(
      ["Название", "Город", "Комнаты", "Обложка", "Обновлено"],
      listingRows
    )}\n`;
  }

  return `## ${product.label}

### Обзор
- Пользователей (всего в БД): ${stats.overview.users}
- Сущностей продукта: ${stats.overview.cards}
- Демо: ${stats.overview.demoGenerations}
- Генераций (сумма used): ${stats.overview.totalGenerations}
- Событий за 7 дней: ${stats.overview.events7d}

### Воронка (агрегат)
- Просмотры: ${stats.funnel.pageViews}
- CTA: ${stats.funnel.ctaClicks}
- Регистрации: ${stats.funnel.registrations}
- Входы: ${stats.funnel.logins}
- Генерации: ${stats.funnel.generations}
- Paywall: ${stats.funnel.paywallViews}
- Оплаты (клики): ${stats.funnel.paymentClicks}

### Воронка 7 дней
${formatFunnel7d(stats.funnel7d)}

### Сессии (${stats.sessionDuration.periodDays} дн.)
- Всего сессий: ${stats.sessionDuration.totalSessions}
- Средняя длительность: ${stats.sessionDuration.averageSeconds} сек
- Медиана: ${stats.sessionDuration.medianSeconds} сек
- Пиковый час: ${stats.sessionDuration.peakHourLabel || "—"}

${formatDaySeries("Регистрации по дням", stats.signupsByDay)}${formatDaySeries("Генерации по дням", stats.generationsByDay)}
### Повторные визиты (${stats.returningVisitors.length})
${linesFromRows(["Тип", "Кто", "Визитов", "Дней", "Последний"], returningRows)}

### Недавние пользователи (${stats.recentUsers.length}, топ-30)
${linesFromRows(["Имя", "Email", "Вход", "Генерации", "Регистрация"], recentUserRows)}

### Демо (${stats.recentDemos.length}, топ-25)
${linesFromRows(["Товар", "Статус", "Описание", "Оценка", "Создано"], demoRows)}

### Карточки (${stats.recentCards.length}, топ-25)
${linesFromRows(["Название", "МП", "Категория", "Оценка", "Создано"], cardRows)}

### Ошибки демо (${stats.recentDemoErrors.length}, топ-20)
${linesFromRows(["Ошибка", "Код", "Путь", "Когда"], errorRows)}

### Пути пользователей (${stats.userJourneys.length}, топ-20)
${linesFromRows(["Сессия", "Тип", "Просмотры", "Клики", "Конверсии", "Путь"], journeyRows)}

### Топ кликов
${linesFromRows(
  ["Элемент", "Клики"],
  stats.topClicks.slice(0, 15).map((item) => [truncate(item.label, 48), String(item.count)])
)}

${extra}`;
}

export function formatAdminGptExportMarkdown(payload: AdminGptExportPayload) {
  const userRows = payload.users.users.map((user) => [
    truncate(user.name || "—", 24),
    truncate(user.email, 34),
    user.registrationProduct,
    user.planTier,
    user.authMethods,
    String(user.generationsUsed),
    String(user.generationCredits),
    String(user.paymentsCount),
    String(user.totalPaidRub),
    user.registeredFromDemo ? "да" : "нет",
    formatDate(user.createdAt)
  ]);

  const promoRows = payload.promoCodes.map((promo) => [
    promo.code,
    promo.product,
    String(promo.credits),
    truncate(promo.assignedEmail, 28),
    promo.redeemedAt ? formatDate(promo.redeemedAt) : "активен"
  ]);

  const presenceRows = (Object.keys(payload.livePresence) as AdminProductId[]).flatMap((productId) => {
    const presence = payload.livePresence[productId];
    return presence.visitors.map((visitor) => [
      ADMIN_PRODUCTS[productId].shortLabel,
      truncate(visitor.displayName, 28),
      visitor.isAuthed ? "auth" : "guest",
      truncate(visitor.pathLabel, 24),
      truncate(visitor.lastActionLabel || "—", 28),
      formatDate(visitor.lastSeenAt)
    ]);
  });

  return `# Отчёт админки для анализа GPT

- Выгружено: ${formatDate(payload.exportedAt)}
- Сайт: ${payload.siteUrl || "не указан"}

## Задание для GPT
${payload.analysisBrief}

## Сводка пользователей
- Всего в выгрузке: ${payload.users.total}
- MarketCard: ${payload.users.byProduct.marketcard}
- StoryStudio: ${payload.users.byProduct.storystudio}
- КвартоВид: ${payload.users.byProduct.kvartovid}
- Без продукта: ${payload.users.byProduct.unknown}

${formatProductSection("marketcard", payload.products.marketcard)}
${formatProductSection("storystudio", payload.products.storystudio)}
${formatProductSection("kvartovid", payload.products.kvartovid)}

## Все пользователи (${payload.users.users.length})
${linesFromRows(
  ["Имя", "Email", "Продукт", "Тариф", "Вход", "Used", "Credits", "Оплат", "₽", "Из демо", "Регистрация"],
  userRows
)}

## Промокоды (${payload.promoCodes.length})
${linesFromRows(["Код", "Продукт", "Кредиты", "Email", "Статус"], promoRows)}

## Сейчас на сайте
${linesFromRows(
  ["Продукт", "Посетитель", "Тип", "Страница", "Действие", "Активность"],
  presenceRows
)}
`;
}
