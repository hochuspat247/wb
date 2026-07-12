import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { FREE_TRIAL_CARDS, MONTHLY_FREE_RESET_MS } from "@/lib/pricing";

type MonthlyFreeUser = {
  id: string;
  monthlyFreeUsed?: number | null;
  monthlyFreePeriodStart?: Date | null;
  createdAt?: Date | null;
};

export type MonthlyFreeQuotaState = {
  allowance: number;
  used: number;
  remaining: number;
  periodStart: Date;
  resetsAt: Date;
};

function resolvePeriodStart(user: MonthlyFreeUser) {
  return user.monthlyFreePeriodStart ?? user.createdAt ?? new Date();
}

export function buildMonthlyFreeQuotaState(
  user: MonthlyFreeUser,
  now = new Date()
): MonthlyFreeQuotaState {
  let periodStart = resolvePeriodStart(user);
  let used = user.monthlyFreeUsed ?? 0;

  while (now.getTime() >= periodStart.getTime() + MONTHLY_FREE_RESET_MS) {
    used = 0;
    periodStart = new Date(periodStart.getTime() + MONTHLY_FREE_RESET_MS);
  }

  const remaining = Math.max(0, FREE_TRIAL_CARDS - used);

  return {
    allowance: FREE_TRIAL_CARDS,
    used,
    remaining,
    periodStart,
    resetsAt: new Date(periodStart.getTime() + MONTHLY_FREE_RESET_MS)
  };
}

export async function ensureMonthlyFreeQuotaFresh(userId: string, now = new Date()) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      monthlyFreeUsed: true,
      monthlyFreePeriodStart: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const current = buildMonthlyFreeQuotaState(user, now);
  const storedPeriodStart = resolvePeriodStart(user).getTime();
  const storedUsed = user.monthlyFreeUsed ?? 0;

  if (storedPeriodStart !== current.periodStart.getTime() || storedUsed !== current.used) {
    await db
      .update(users)
      .set({
        monthlyFreeUsed: current.used,
        monthlyFreePeriodStart: current.periodStart
      })
      .where(eq(users.id, userId));
  }

  return current;
}
