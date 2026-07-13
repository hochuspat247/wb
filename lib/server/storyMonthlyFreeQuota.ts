import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  STORY_FREE_PORTRAIT,
  STORY_FREE_TRIAL,
  STORY_MONTHLY_RESET_MS
} from "@/lib/storystudio/pricing";

type StoryMonthlyFreeUser = {
  id: string;
  storyMonthlyFreeUsed?: number | null;
  storyMonthlyFreePortraitUsed?: number | null;
  storyMonthlyFreePeriodStart?: Date | null;
  createdAt?: Date | null;
};

export type StoryMonthlyFreeQuotaState = {
  allowance: number;
  used: number;
  remaining: number;
  portraitAllowance: number;
  portraitUsed: number;
  portraitRemaining: number;
  periodStart: Date;
  resetsAt: Date;
};

function resolvePeriodStart(user: StoryMonthlyFreeUser) {
  return user.storyMonthlyFreePeriodStart ?? user.createdAt ?? new Date();
}

export function buildStoryMonthlyFreeQuotaState(
  user: StoryMonthlyFreeUser,
  now = new Date()
): StoryMonthlyFreeQuotaState {
  let periodStart = resolvePeriodStart(user);
  let used = user.storyMonthlyFreeUsed ?? 0;
  let portraitUsed = user.storyMonthlyFreePortraitUsed ?? 0;

  while (now.getTime() >= periodStart.getTime() + STORY_MONTHLY_RESET_MS) {
    used = 0;
    portraitUsed = 0;
    periodStart = new Date(periodStart.getTime() + STORY_MONTHLY_RESET_MS);
  }

  return {
    allowance: STORY_FREE_TRIAL,
    used,
    remaining: Math.max(0, STORY_FREE_TRIAL - used),
    portraitAllowance: STORY_FREE_PORTRAIT,
    portraitUsed,
    portraitRemaining: Math.max(0, STORY_FREE_PORTRAIT - portraitUsed),
    periodStart,
    resetsAt: new Date(periodStart.getTime() + STORY_MONTHLY_RESET_MS)
  };
}

export async function ensureStoryMonthlyFreeQuotaFresh(userId: string, now = new Date()) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      storyMonthlyFreeUsed: true,
      storyMonthlyFreePortraitUsed: true,
      storyMonthlyFreePeriodStart: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const current = buildStoryMonthlyFreeQuotaState(user, now);
  const storedPeriodStart = resolvePeriodStart(user).getTime();
  const storedUsed = user.storyMonthlyFreeUsed ?? 0;
  const storedPortraitUsed = user.storyMonthlyFreePortraitUsed ?? 0;

  if (
    storedPeriodStart !== current.periodStart.getTime() ||
    storedUsed !== current.used ||
    storedPortraitUsed !== current.portraitUsed
  ) {
    await db
      .update(users)
      .set({
        storyMonthlyFreeUsed: current.used,
        storyMonthlyFreePortraitUsed: current.portraitUsed,
        storyMonthlyFreePeriodStart: current.periodStart
      })
      .where(eq(users.id, userId));
  }

  return current;
}
