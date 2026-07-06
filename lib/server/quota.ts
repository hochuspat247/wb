import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";

export type UserQuota = {
  credits: number;
  used: number;
  remaining: number;
  canGenerate: boolean;
};

export async function getUserQuota(userId: string): Promise<UserQuota> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  const credits = user.generationCredits ?? FREE_TRIAL_CARDS;
  const used = user.generationsUsed ?? 0;
  const remaining = Math.max(0, credits - used);

  return {
    credits,
    used,
    remaining,
    canGenerate: remaining > 0
  };
}

export async function consumeGeneration(userId: string): Promise<UserQuota> {
  const quota = await getUserQuota(userId);

  if (!quota.canGenerate) {
    return quota;
  }

  await db.update(users).set({ generationsUsed: quota.used + 1 }).where(eq(users.id, userId));

  return getUserQuota(userId);
}

export async function addGenerationCredits(userId: string, amount: number) {
  const quota = await getUserQuota(userId);

  await db
    .update(users)
    .set({ generationCredits: quota.credits + amount })
    .where(eq(users.id, userId));

  return getUserQuota(userId);
}
