import { randomUUID } from "crypto";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { imageGenerationTickets, users } from "@/lib/db/schema";
import { getUserQuota } from "@/lib/server/quota";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

const TICKET_TTL_MS = 20 * 60 * 1000;
const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000;

export class ImageGenerationQuotaExceededError extends Error {
  constructor() {
    super("IMAGE_GENERATION_QUOTA_EXCEEDED");
  }
}

type TicketDb = Pick<typeof db, "delete" | "select" | "insert" | "query" | "transaction">;

async function cleanupExpiredImageGenerationTickets(client: TicketDb = db, now = new Date()) {
  await client
    .delete(imageGenerationTickets)
    .where(lt(imageGenerationTickets.expiresAt, new Date(now.getTime() - CLEANUP_AFTER_MS)));
}

async function countActiveImageGenerationTickets(userId: string, client: TicketDb = db, now = new Date()) {
  await cleanupExpiredImageGenerationTickets(client, now);

  const [row] = await client
    .select({ value: sql<number>`count(*)` })
    .from(imageGenerationTickets)
    .where(
      and(
        eq(imageGenerationTickets.userId, userId),
        isNull(imageGenerationTickets.usedAt),
        gt(imageGenerationTickets.expiresAt, now)
      )
    );

  return Number(row?.value ?? 0);
}

export async function createImageGenerationTicket(userId: string, purpose = "card_image") {
  const now = new Date();
  const id = randomUUID();

  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!hasUnlimitedGenerations(user)) {
      const quota = await getUserQuota(userId);
      const activeTickets = await countActiveImageGenerationTickets(userId, tx, now);

      if (quota.remaining <= activeTickets) {
        throw new ImageGenerationQuotaExceededError();
      }
    }

    await tx.insert(imageGenerationTickets).values({
      id,
      userId,
      purpose,
      usedAt: null,
      expiresAt: new Date(now.getTime() + TICKET_TTL_MS),
      createdAt: now
    });

    return id;
  });
}

export async function revokeImageGenerationTicket(ticketId: string, userId: string) {
  await db
    .delete(imageGenerationTickets)
    .where(
      and(
        eq(imageGenerationTickets.id, ticketId),
        eq(imageGenerationTickets.userId, userId),
        isNull(imageGenerationTickets.usedAt)
      )
    );
}

export async function hasValidImageGenerationTicket(ticketId: string | undefined, userId: string) {
  const cleanTicketId = ticketId?.trim();

  if (!cleanTicketId || cleanTicketId.length > 120) {
    return false;
  }

  const now = new Date();
  await cleanupExpiredImageGenerationTickets(db, now);

  const ticket = await db.query.imageGenerationTickets.findFirst({
    where: and(
      eq(imageGenerationTickets.id, cleanTicketId),
      eq(imageGenerationTickets.userId, userId),
      isNull(imageGenerationTickets.usedAt),
      gt(imageGenerationTickets.expiresAt, now)
    )
  });

  return Boolean(ticket);
}

export async function consumeImageGenerationTicket(ticketId: string | undefined, userId: string) {
  const cleanTicketId = ticketId?.trim();

  if (!cleanTicketId || cleanTicketId.length > 120) {
    return false;
  }

  const now = new Date();
  await cleanupExpiredImageGenerationTickets(db, now);

  const updated = await db
    .update(imageGenerationTickets)
    .set({ usedAt: now })
    .where(
      and(
        eq(imageGenerationTickets.id, cleanTicketId),
        eq(imageGenerationTickets.userId, userId),
        isNull(imageGenerationTickets.usedAt),
        gt(imageGenerationTickets.expiresAt, now)
      )
    )
    .returning({ id: imageGenerationTickets.id });

  return updated.length > 0;
}
