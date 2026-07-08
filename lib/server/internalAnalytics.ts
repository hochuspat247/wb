import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, users } from "@/lib/db/schema";
import { getAdminEmails } from "@/lib/server/admin";

function getUnlimitedEmails() {
  return (process.env.UNLIMITED_GENERATION_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getInternalAnalyticsEmails() {
  return [...new Set([...getAdminEmails(), ...getUnlimitedEmails()])];
}

export async function getInternalUserIds() {
  const emails = getInternalAnalyticsEmails();

  if (!emails.length) {
    return [];
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(sql`lower(${users.email})`, emails));

  return rows.map((row) => row.id);
}

export async function getExcludedAnalyticsSessionIds(since: Date, internalUserIds: string[]) {
  if (!internalUserIds.length) {
    return [];
  }

  const rows = await db
    .selectDistinct({ sessionId: analyticsEvents.sessionId })
    .from(analyticsEvents)
    .where(and(gte(analyticsEvents.createdAt, since), inArray(analyticsEvents.userId, internalUserIds)));

  return rows.map((row) => row.sessionId).filter(Boolean);
}

export async function deleteInternalAnalyticsEvents(since: Date) {
  const internalUserIds = await getInternalUserIds();

  if (!internalUserIds.length) {
    return { deleted: 0, internalUserIds: [] as string[] };
  }

  const deleted = await db
    .delete(analyticsEvents)
    .where(and(gte(analyticsEvents.createdAt, since), inArray(analyticsEvents.userId, internalUserIds)))
    .returning({ id: analyticsEvents.id });

  return { deleted: deleted.length, internalUserIds };
}
