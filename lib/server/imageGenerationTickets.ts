import { randomUUID } from "crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { imageGenerationTickets } from "@/lib/db/schema";

const TICKET_TTL_MS = 20 * 60 * 1000;
const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000;

export async function createImageGenerationTicket(userId: string, purpose = "card_image") {
  const now = new Date();
  const id = randomUUID();

  await db.insert(imageGenerationTickets).values({
    id,
    userId,
    purpose,
    usedAt: null,
    expiresAt: new Date(now.getTime() + TICKET_TTL_MS),
    createdAt: now
  });

  return id;
}

export async function consumeImageGenerationTicket(ticketId: string | undefined, userId: string) {
  const cleanTicketId = ticketId?.trim();

  if (!cleanTicketId || cleanTicketId.length > 120) {
    return false;
  }

  const now = new Date();

  await db
    .delete(imageGenerationTickets)
    .where(lt(imageGenerationTickets.expiresAt, new Date(now.getTime() - CLEANUP_AFTER_MS)));

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
