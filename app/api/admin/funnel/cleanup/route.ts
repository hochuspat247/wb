import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server/admin";
import {
  deleteInternalAnalyticsEvents,
  getInternalAnalyticsEmails
} from "@/lib/server/internalAnalytics";

export const runtime = "nodejs";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function POST() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const internalEmails = getInternalAnalyticsEmails();

  if (!internalEmails.length) {
    return NextResponse.json(
      {
        error: "Укажите ADMIN_EMAILS или UNLIMITED_GENERATION_EMAILS в env, чтобы определить тестовые аккаунты."
      },
      { status: 400 }
    );
  }

  const result = await deleteInternalAnalyticsEvents(daysAgo(7));

  return NextResponse.json({
    deleted: result.deleted,
    internalEmails,
    message:
      result.deleted > 0
        ? `Удалено ${result.deleted} тестовых событий аналитики за 7 дней. Оплаты в БД не трогали — они просто исключаются из воронки.`
        : "Тестовых событий аналитики за 7 дней не найдено. Воронка уже фильтрует внутренние аккаунты."
  });
}
