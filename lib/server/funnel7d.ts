import { and, count, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, payments, users, videoGenerationOrders } from "@/lib/db/schema";

export type Funnel7dStep = {
  id: string;
  label: string;
  count: number;
  fromPreviousPercent: number | null;
  fromStartPercent: number | null;
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function countDistinctSessions(filters: {
  since: Date;
  eventNames?: string[];
  eventType?: "page_view" | "click" | "conversion";
}) {
  const conditions = [gte(analyticsEvents.createdAt, filters.since)];

  if (filters.eventType) {
    conditions.push(eq(analyticsEvents.eventType, filters.eventType));
  }

  if (filters.eventNames?.length) {
    conditions.push(inArray(analyticsEvents.eventName, filters.eventNames));
  }

  const [row] = await db
    .select({
      value: sql<number>`count(distinct ${analyticsEvents.sessionId})`
    })
    .from(analyticsEvents)
    .where(and(...conditions));

  return Number(row?.value ?? 0);
}

function buildStepPercents(steps: Array<{ id: string; label: string; count: number }>): Funnel7dStep[] {
  const startCount = steps[0]?.count ?? 0;

  return steps.map((step, index) => {
    const previousCount = index > 0 ? steps[index - 1]?.count ?? 0 : 0;

    return {
      ...step,
      fromPreviousPercent:
        index === 0 ? null : previousCount > 0 ? Math.round((step.count / previousCount) * 100) : 0,
      fromStartPercent: startCount > 0 ? Math.round((step.count / startCount) * 100) : index === 0 ? 100 : 0
    };
  });
}

export async function getFunnel7d(): Promise<Funnel7dStep[]> {
  const since7d = daysAgo(7);

  const [
    visitors,
    createCardClicks,
    photoUploads,
    descriptionsFilled,
    demoStarts,
    generationsSuccess,
    registrations,
    pngDownloads,
    videoClicks,
    paymentOpens,
    generationPayments,
    videoPayments
  ] = await Promise.all([
    countDistinctSessions({ since: since7d, eventType: "page_view" }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["click_create_card", "header_try_click", "hero_cta_click", "hero_demo_generate_click"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["photo_uploaded", "hero_file_selected", "upload_photo"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["description_filled", "hero_description_filled"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["demo_generation_started"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["demo_generation_completed", "generation_complete"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["register_complete", "auth_completed_from_result"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["download_png", "download_original_click"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["video_create_click"]
    }),
    countDistinctSessions({
      since: since7d,
      eventType: "conversion",
      eventNames: ["payment_click", "video_payment_started"]
    }),
    db
      .select({ value: count() })
      .from(payments)
      .where(and(isNotNull(payments.creditedAt), gte(payments.creditedAt, since7d))),
    db
      .select({ value: count() })
      .from(videoGenerationOrders)
      .where(and(isNotNull(videoGenerationOrders.paidAt), gte(videoGenerationOrders.paidAt, since7d)))
  ]);

  const [newUsersRow] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, since7d));

  const registrationCount = Math.max(registrations, Number(newUsersRow?.value ?? 0));
  const successfulPayments = Number(generationPayments[0]?.value ?? 0) + Number(videoPayments[0]?.value ?? 0);

  return buildStepPercents([
    { id: "visitors", label: "Посетители сайта", count: visitors },
    { id: "create_click", label: 'Клик «создать карточку»', count: createCardClicks },
    { id: "photo_upload", label: "Загрузка фото", count: photoUploads },
    { id: "description", label: "Заполнение описания", count: descriptionsFilled },
    { id: "demo_start", label: "Запуск демо", count: demoStarts },
    { id: "generation_success", label: "Успешная генерация", count: generationsSuccess },
    { id: "registration", label: "Регистрация", count: registrationCount },
    { id: "png_download", label: "Скачивание PNG", count: pngDownloads },
    { id: "video_click", label: 'Клик «Создать видео»', count: videoClicks },
    { id: "payment_open", label: "Открытие оплаты", count: paymentOpens },
    { id: "payment_success", label: "Успешная оплата", count: successfulPayments }
  ]);
}
