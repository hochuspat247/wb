import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { STORY_FREE_PORTRAIT, STORY_FREE_TRIAL } from "@/lib/storystudio/pricing";
import { ensureStoryMonthlyFreeQuotaFresh } from "@/lib/server/storyMonthlyFreeQuota";
import { getUnlimitedRemainingCount, hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

export type StoryUserQuota = {
  credits: number;
  used: number;
  remaining: number;
  canGenerate: boolean;
  canGeneratePortrait: boolean;
  unlimited?: boolean;
  monthlyFreeAllowance: number;
  monthlyFreeUsed: number;
  monthlyFreeRemaining: number;
  portraitFreeAllowance: number;
  portraitFreeUsed: number;
  portraitFreeRemaining: number;
  monthlyFreeResetsAt: string;
  paidCredits: number;
  paidCreditsUsed: number;
};

export type StoryGenerationKind = "text" | "portrait";

function buildUnlimitedStoryQuota(used: number): StoryUserQuota {
  const remaining = getUnlimitedRemainingCount();

  return {
    credits: remaining,
    used,
    remaining,
    canGenerate: true,
    canGeneratePortrait: true,
    unlimited: true,
    monthlyFreeAllowance: STORY_FREE_TRIAL,
    monthlyFreeUsed: 0,
    monthlyFreeRemaining: STORY_FREE_TRIAL,
    portraitFreeAllowance: STORY_FREE_PORTRAIT,
    portraitFreeUsed: 0,
    portraitFreeRemaining: STORY_FREE_PORTRAIT,
    monthlyFreeResetsAt: new Date().toISOString(),
    paidCredits: 0,
    paidCreditsUsed: used
  };
}

export async function getStoryUserQuota(userId: string): Promise<StoryUserQuota> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  const used = user.storyGenerationsUsed ?? 0;

  if (hasUnlimitedGenerations(user)) {
    return buildUnlimitedStoryQuota(used);
  }

  const monthlyFree = await ensureStoryMonthlyFreeQuotaFresh(userId);
  const paidCredits = Math.max(0, user.storyGenerationCredits ?? 0);
  const paidCreditsUsed = Math.max(0, user.storyGenerationsUsed ?? 0);
  const paidRemaining = Math.max(0, paidCredits - paidCreditsUsed);
  const textRemaining = monthlyFree.remaining + paidRemaining;
  const portraitRemaining = monthlyFree.portraitRemaining + paidRemaining;

  return {
    credits: monthlyFree.allowance + monthlyFree.portraitAllowance + paidCredits,
    used: monthlyFree.used + monthlyFree.portraitUsed + paidCreditsUsed,
    remaining: monthlyFree.remaining + monthlyFree.portraitRemaining + paidRemaining,
    canGenerate: textRemaining > 0,
    canGeneratePortrait: portraitRemaining > 0,
    monthlyFreeAllowance: monthlyFree.allowance,
    monthlyFreeUsed: monthlyFree.used,
    monthlyFreeRemaining: monthlyFree.remaining,
    portraitFreeAllowance: monthlyFree.portraitAllowance,
    portraitFreeUsed: monthlyFree.portraitUsed,
    portraitFreeRemaining: monthlyFree.portraitRemaining,
    monthlyFreeResetsAt: monthlyFree.resetsAt.toISOString(),
    paidCredits,
    paidCreditsUsed
  };
}

export type ConsumeStoryGenerationResult = {
  quota: StoryUserQuota;
  consumed: boolean;
  source?: "monthly_free_text" | "monthly_free_portrait" | "paid";
};

export async function consumeStoryGeneration(
  userId: string,
  kind: StoryGenerationKind
): Promise<ConsumeStoryGenerationResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (hasUnlimitedGenerations(user)) {
    return {
      quota: buildUnlimitedStoryQuota(user.storyGenerationsUsed ?? 0),
      consumed: true,
      source: "paid"
    };
  }

  const monthlyFree = await ensureStoryMonthlyFreeQuotaFresh(userId);

  if (kind === "portrait" && monthlyFree.portraitRemaining > 0) {
    const result = await db
      .update(users)
      .set({ storyMonthlyFreePortraitUsed: sql`${users.storyMonthlyFreePortraitUsed} + 1` })
      .where(
        sql`${users.id} = ${userId} AND ${users.storyMonthlyFreePortraitUsed} < ${STORY_FREE_PORTRAIT}`
      )
      .returning({ id: users.id });

    return {
      quota: await getStoryUserQuota(userId),
      consumed: result.length > 0,
      source: "monthly_free_portrait"
    };
  }

  if (kind === "text" && monthlyFree.remaining > 0) {
    const result = await db
      .update(users)
      .set({ storyMonthlyFreeUsed: sql`${users.storyMonthlyFreeUsed} + 1` })
      .where(sql`${users.id} = ${userId} AND ${users.storyMonthlyFreeUsed} < ${STORY_FREE_TRIAL}`)
      .returning({ id: users.id });

    return {
      quota: await getStoryUserQuota(userId),
      consumed: result.length > 0,
      source: "monthly_free_text"
    };
  }

  const result = await db
    .update(users)
    .set({ storyGenerationsUsed: sql`${users.storyGenerationsUsed} + 1` })
    .where(
      sql`${users.id} = ${userId} AND ${users.storyGenerationsUsed} < ${users.storyGenerationCredits}`
    )
    .returning({ id: users.id });

  return {
    quota: await getStoryUserQuota(userId),
    consumed: result.length > 0,
    source: "paid"
  };
}

export async function refundStoryGeneration(
  userId: string,
  source?: ConsumeStoryGenerationResult["source"]
): Promise<StoryUserQuota> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (hasUnlimitedGenerations(user)) {
    return buildUnlimitedStoryQuota(user.storyGenerationsUsed ?? 0);
  }

  await ensureStoryMonthlyFreeQuotaFresh(userId);

  const freshUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!freshUser) {
    throw new Error("User not found");
  }

  const paidCreditsUsed = freshUser.storyGenerationsUsed ?? 0;
  const monthlyFreeUsed = freshUser.storyMonthlyFreeUsed ?? 0;
  const portraitFreeUsed = freshUser.storyMonthlyFreePortraitUsed ?? 0;

  if (source === "monthly_free_portrait" && portraitFreeUsed > 0) {
    await db
      .update(users)
      .set({ storyMonthlyFreePortraitUsed: portraitFreeUsed - 1 })
      .where(eq(users.id, userId));
  } else if (source === "monthly_free_text" && monthlyFreeUsed > 0) {
    await db
      .update(users)
      .set({ storyMonthlyFreeUsed: monthlyFreeUsed - 1 })
      .where(eq(users.id, userId));
  } else if (paidCreditsUsed > 0) {
    await db
      .update(users)
      .set({ storyGenerationsUsed: paidCreditsUsed - 1 })
      .where(eq(users.id, userId));
  }

  return getStoryUserQuota(userId);
}

export async function addStoryGenerationCredits(userId: string, amount: number) {
  const quota = await getStoryUserQuota(userId);

  if (quota.unlimited) {
    return quota;
  }

  await db
    .update(users)
    .set({ storyGenerationCredits: (quota.paidCredits ?? 0) + amount })
    .where(eq(users.id, userId));

  return getStoryUserQuota(userId);
}
