import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Минимальный пакет с премиум 18+ — «Автор» (50 генераций) */
export const STORY_PREMIUM_MIN_PACKAGE_CREDITS = 50;

export async function hasStoryPremiumUnlocked(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { storyPremiumUnlocked: true }
  });

  return Boolean(user?.storyPremiumUnlocked);
}

export async function unlockStoryPremium(userId: string) {
  await db.update(users).set({ storyPremiumUnlocked: true }).where(eq(users.id, userId));
}
