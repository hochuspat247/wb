import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";
import { ensureMonthlyFreeQuotaFresh } from "@/lib/server/monthlyFreeQuota";
import { getUnlimitedRemainingCount, hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

export type UserQuota = {
  credits: number;
  used: number;
  remaining: number;
  canGenerate: boolean;
  unlimited?: boolean;
  monthlyFreeAllowance?: number;
  monthlyFreeUsed?: number;
  monthlyFreeRemaining?: number;
  monthlyFreeResetsAt?: string;
  paidCredits?: number;
  paidCreditsUsed?: number;
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

  const monthlyFree = await ensureMonthlyFreeQuotaFresh(userId);
  const paidCredits = Math.max(0, user.generationCredits ?? 0);
  const paidCreditsUsed = Math.max(0, user.generationsUsed ?? 0);
  const paidRemaining = Math.max(0, paidCredits - paidCreditsUsed);
  const remaining = monthlyFree.remaining + paidRemaining;

  return {
    credits: monthlyFree.allowance + paidCredits,
    used: monthlyFree.used + paidCreditsUsed,
    remaining,
    canGenerate: remaining > 0,
    monthlyFreeAllowance: monthlyFree.allowance,
    monthlyFreeUsed: monthlyFree.used,
    monthlyFreeRemaining: monthlyFree.remaining,
    monthlyFreeResetsAt: monthlyFree.resetsAt.toISOString(),
    paidCredits,
    paidCreditsUsed
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

  const monthlyFree = await ensureMonthlyFreeQuotaFresh(userId);

  if (monthlyFree.remaining > 0) {
    const result = await db
      .update(users)
      .set({ monthlyFreeUsed: sql`${users.monthlyFreeUsed} + 1` })
      .where(sql`${users.id} = ${userId} AND ${users.monthlyFreeUsed} < ${FREE_TRIAL_CARDS}`)
      .returning({ id: users.id });

    return {
      quota: await getUserQuota(userId),
      consumed: result.length > 0
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

  await ensureMonthlyFreeQuotaFresh(userId);

  const freshUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!freshUser) {
    throw new Error("User not found");
  }

  const paidCreditsUsed = freshUser.generationsUsed ?? 0;
  const monthlyFreeUsed = freshUser.monthlyFreeUsed ?? 0;

  if (paidCreditsUsed > 0) {
    await db
      .update(users)
      .set({ generationsUsed: paidCreditsUsed - 1 })
      .where(eq(users.id, userId));
  } else if (monthlyFreeUsed > 0) {
    await db
      .update(users)
      .set({ monthlyFreeUsed: monthlyFreeUsed - 1 })
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
    .set({ generationCredits: (quota.paidCredits ?? 0) + amount })
    .where(eq(users.id, userId));

  return getUserQuota(userId);
}
