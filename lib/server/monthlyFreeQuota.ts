import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";

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
  /** Kept for API compatibility — free quota no longer renews. */
  resetsAt: Date;
};

function resolvePeriodStart(user: MonthlyFreeUser) {
  return user.monthlyFreePeriodStart ?? user.createdAt ?? new Date();
}

/**
 * One-time free download after registration.
 * Does not roll over monthly — used credits stay consumed forever.
 */
export function buildMonthlyFreeQuotaState(
  user: MonthlyFreeUser,
  _now = new Date()
): MonthlyFreeQuotaState {
  const periodStart = resolvePeriodStart(user);
  const used = user.monthlyFreeUsed ?? 0;
  const remaining = Math.max(0, FREE_TRIAL_CARDS - used);

  return {
    allowance: FREE_TRIAL_CARDS,
    used,
    remaining,
    periodStart,
    // Sentinel: same as period start so clients that still read resetsAt do not promise a refill.
    resetsAt: periodStart
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

  if (storedPeriodStart !== current.periodStart.getTime() || user.monthlyFreePeriodStart == null) {
    await db
      .update(users)
      .set({
        monthlyFreePeriodStart: current.periodStart
      })
      .where(eq(users.id, userId));
  }

  return current;
}
