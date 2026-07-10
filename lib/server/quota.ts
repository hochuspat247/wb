import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";
import { getUnlimitedRemainingCount, hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

export type UserQuota = {
  credits: number;
  used: number;
  remaining: number;
  canGenerate: boolean;
  unlimited?: boolean;
};

function buildUnlimitedQuota(used: number): UserQuota {
  const remaining = getUnlimitedRemainingCount();

  return {
    credits: remaining,
    used,
    remaining,
    canGenerate: true,
    unlimited: true
  };
}

export async function getUserQuota(userId: string): Promise<UserQuota> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  const used = user.generationsUsed ?? 0;

  if (hasUnlimitedGenerations(user)) {
    return buildUnlimitedQuota(used);
  }

  let credits = user.generationCredits ?? FREE_TRIAL_CARDS;

  if (credits < FREE_TRIAL_CARDS) {
    credits = FREE_TRIAL_CARDS;
    await db
      .update(users)
      .set({ generationCredits: FREE_TRIAL_CARDS })
      .where(eq(users.id, userId));
  }

  const remaining = Math.max(0, credits - used);

  return {
    credits,
    used,
    remaining,
    canGenerate: remaining > 0
  };
}

export type ConsumeGenerationResult = {
  quota: UserQuota;
  consumed: boolean;
};

export async function consumeGeneration(userId: string): Promise<ConsumeGenerationResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (hasUnlimitedGenerations(user)) {
    return {
      quota: buildUnlimitedQuota(user.generationsUsed ?? 0),
      consumed: true
    };
  }

  const result = await db
    .update(users)
    .set({ generationsUsed: sql`${users.generationsUsed} + 1` })
    .where(sql`${users.id} = ${userId} AND ${users.generationsUsed} < ${users.generationCredits}`)
    .returning({ id: users.id });

  return {
    quota: await getUserQuota(userId),
    consumed: result.length > 0
  };
}

export async function refundGeneration(userId: string): Promise<UserQuota> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (hasUnlimitedGenerations(user)) {
    return buildUnlimitedQuota(user.generationsUsed ?? 0);
  }

  const used = user.generationsUsed ?? 0;

  if (used > 0) {
    await db
      .update(users)
      .set({ generationsUsed: used - 1 })
      .where(eq(users.id, userId));
  }

  return getUserQuota(userId);
}

export async function addGenerationCredits(userId: string, amount: number) {
  const quota = await getUserQuota(userId);

  if (quota.unlimited) {
    return quota;
  }

  await db
    .update(users)
    .set({ generationCredits: quota.credits + amount })
    .where(eq(users.id, userId));

  return getUserQuota(userId);
}
