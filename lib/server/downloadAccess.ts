import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerations, payments, productCards, users } from "@/lib/db/schema";

export type UserDownloadAccess = {
  freeCleanDownloadGenerationId: string | null;
  downloadsFullyUnlocked: boolean;
};

export function isGenerationDownloadUnlocked(access: UserDownloadAccess, _generationId: string) {
  // Free tier is watermark-only. Clean downloads unlock only after a paid purchase.
  return access.downloadsFullyUnlocked;
}

export async function getUserDownloadAccess(userId: string): Promise<UserDownloadAccess> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      freeCleanDownloadGenerationId: true,
      hasPurchasedGenerationCredits: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    freeCleanDownloadGenerationId: user.freeCleanDownloadGenerationId ?? null,
    downloadsFullyUnlocked: Boolean(user.hasPurchasedGenerationCredits)
  };
}

async function findEarliestUserGeneration(userId: string) {
  const demos = await db
    .select({
      id: demoGenerations.id,
      createdAt: demoGenerations.createdAt
    })
    .from(demoGenerations)
    .where(eq(demoGenerations.userId, userId));

  const cards = await db
    .select({
      id: productCards.id,
      createdAt: productCards.createdAt
    })
    .from(productCards)
    .where(eq(productCards.userId, userId));

  const all = [...demos, ...cards];

  if (!all.length) {
    return null;
  }

  return all.reduce<(typeof all)[number] | null>((earliest, item) => {
    if (!earliest) {
      return item;
    }

    return item.createdAt < earliest.createdAt ? item : earliest;
  }, null);
}

export async function registerGenerationForCleanDownload(
  userId: string,
  generationId: string,
  createdAt: Date
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      freeCleanDownloadGenerationId: true
    }
  });

  if (!user) {
    return;
  }

  const currentId = user.freeCleanDownloadGenerationId;

  if (!currentId) {
    const earliest = await findEarliestUserGeneration(userId);
    const winner =
      !earliest || createdAt.getTime() <= earliest.createdAt.getTime()
        ? { id: generationId, createdAt }
        : earliest;

    await db
      .update(users)
      .set({ freeCleanDownloadGenerationId: winner.id })
      .where(eq(users.id, userId));
    return;
  }

  if (currentId === generationId) {
    return;
  }

  const currentCreatedAt = await getGenerationCreatedAt(userId, currentId);

  if (!currentCreatedAt || createdAt < currentCreatedAt) {
    await db
      .update(users)
      .set({ freeCleanDownloadGenerationId: generationId })
      .where(eq(users.id, userId));
  }
}

export async function backfillCleanDownloadGeneration(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      freeCleanDownloadGenerationId: true
    }
  });

  if (!user || user.freeCleanDownloadGenerationId) {
    return user?.freeCleanDownloadGenerationId ?? null;
  }

  const earliest = await findEarliestUserGeneration(userId);

  if (!earliest) {
    return null;
  }

  await db
    .update(users)
    .set({ freeCleanDownloadGenerationId: earliest.id })
    .where(eq(users.id, userId));

  return earliest.id;
}

export async function unlockAllDownloadsForUser(userId: string) {
  await db
    .update(users)
    .set({ hasPurchasedGenerationCredits: true })
    .where(eq(users.id, userId));
}

export async function syncPurchasedDownloadUnlock(userId: string) {
  const paid = await db.query.payments.findFirst({
    where: and(eq(payments.userId, userId), eq(payments.paid, true), isNotNull(payments.creditedAt)),
    columns: { id: true }
  });

  if (paid) {
    await unlockAllDownloadsForUser(userId);
  }
}

async function getGenerationCreatedAt(userId: string, generationId: string) {
  const demo = await db.query.demoGenerations.findFirst({
    where: and(eq(demoGenerations.id, generationId), eq(demoGenerations.userId, userId)),
    columns: { createdAt: true }
  });

  if (demo?.createdAt) {
    return demo.createdAt;
  }

  const card = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, generationId), eq(productCards.userId, userId)),
    columns: { createdAt: true }
  });

  return card?.createdAt ?? null;
}
