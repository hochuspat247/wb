import { desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, visitorPresence } from "@/lib/db/schema";
import { getActionLabel, getPathLabel, getSectionLabel } from "@/lib/presence/labels";

const ACTIVE_WINDOW_MS = 90_000;
const STALE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CLEANUP_CHANCE = 0.02;

export type PresenceUpsertInput = {
  sessionId: string;
  path: string;
  section?: string;
  lastAction?: string;
  lastActionLabel?: string;
  guestId?: string;
  userId?: string;
  referrer?: string;
  isAuthed?: boolean;
  isVisible?: boolean;
};

function isSqliteBusyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("SQLITE_BUSY") || message.includes("database is locked");
}

async function withSqliteRetry<T>(operation: () => Promise<T>, retries = 3) {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isSqliteBusyError(error) || attempt === retries - 1) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 40 * (attempt + 1));
      });
    }
  }

  throw lastError;
}

async function maybeCleanupStalePresence() {
  if (Math.random() > CLEANUP_CHANCE) {
    return;
  }

  const staleBefore = new Date(Date.now() - STALE_WINDOW_MS);
  await db.delete(visitorPresence).where(lt(visitorPresence.lastSeenAt, staleBefore));
}

export async function upsertVisitorPresence(input: PresenceUpsertInput) {
  const now = new Date();
  const path = input.path.slice(0, 300);
  const pathLabel = getPathLabel(path);
  const section = input.section?.slice(0, 120);
  const sectionLabel = getSectionLabel(section);
  const lastAction = input.lastAction?.slice(0, 120);
  const lastActionLabel = input.lastActionLabel?.slice(0, 240) || getActionLabel(lastAction);

  await withSqliteRetry(async () => {
    await db
      .insert(visitorPresence)
      .values({
        sessionId: input.sessionId.slice(0, 80),
        userId: input.userId,
        guestId: input.guestId?.slice(0, 80),
        path,
        pathLabel,
        section,
        sectionLabel,
        lastAction,
        lastActionLabel,
        referrer: input.referrer?.slice(0, 500),
        isAuthed: Boolean(input.isAuthed),
        isVisible: input.isVisible !== false,
        firstSeenAt: now,
        lastSeenAt: now
      })
      .onConflictDoUpdate({
        target: visitorPresence.sessionId,
        set: {
          userId: input.userId,
          guestId: input.guestId?.slice(0, 80),
          path,
          pathLabel,
          section,
          sectionLabel,
          lastAction,
          lastActionLabel,
          referrer: input.referrer?.slice(0, 500),
          isAuthed: Boolean(input.isAuthed),
          isVisible: input.isVisible !== false,
          lastSeenAt: now
        }
      });
  });

  try {
    await maybeCleanupStalePresence();
  } catch (error) {
    console.error("[MarketCard AI] presence cleanup failed", error);
  }
}

export async function getActiveVisitors() {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);

  const rows = await db
    .select({
      sessionId: visitorPresence.sessionId,
      userId: visitorPresence.userId,
      guestId: visitorPresence.guestId,
      path: visitorPresence.path,
      pathLabel: visitorPresence.pathLabel,
      section: visitorPresence.section,
      sectionLabel: visitorPresence.sectionLabel,
      lastAction: visitorPresence.lastAction,
      lastActionLabel: visitorPresence.lastActionLabel,
      isAuthed: visitorPresence.isAuthed,
      isVisible: visitorPresence.isVisible,
      firstSeenAt: visitorPresence.firstSeenAt,
      lastSeenAt: visitorPresence.lastSeenAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(visitorPresence)
    .leftJoin(users, eq(visitorPresence.userId, users.id))
    .where(gte(visitorPresence.lastSeenAt, activeSince))
    .orderBy(desc(visitorPresence.lastSeenAt));

  const sectionRows = await db
    .select({
      sectionLabel: visitorPresence.sectionLabel,
      value: sql<number>`count(*)`
    })
    .from(visitorPresence)
    .where(gte(visitorPresence.lastSeenAt, activeSince))
    .groupBy(visitorPresence.sectionLabel)
    .orderBy(desc(sql`count(*)`));

  return {
    activeCount: rows.length,
    activeWindowSec: ACTIVE_WINDOW_MS / 1000,
    visitors: rows.map((row) => ({
      sessionId: row.sessionId,
      guestId: row.guestId,
      userId: row.userId,
      displayName: row.userEmail || row.userName || `Гость ${row.sessionId.slice(0, 8)}`,
      path: row.path,
      pathLabel: row.pathLabel || getPathLabel(row.path),
      section: row.section,
      sectionLabel: row.sectionLabel || getSectionLabel(row.section),
      lastAction: row.lastAction,
      lastActionLabel: row.lastActionLabel || getActionLabel(row.lastAction),
      isAuthed: row.isAuthed,
      isVisible: row.isVisible,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt
    })),
    sections: sectionRows.map((row) => ({
      label: row.sectionLabel || "Страница",
      count: row.value
    }))
  };
}
