import { createHash } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerationAttempts } from "@/lib/db/schema";

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      code?: string;
    };

export type RateLimitRule = {
  identityType: string;
  identityHash: string;
  windowMs: number;
  max: number;
};

export type RateLimitAttempt = {
  identityType: string;
  identityHash: string;
};

export function hashRateLimitIdentity(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceRateLimits(rules: RateLimitRule[]): Promise<RateLimitResult> {
  for (const rule of rules) {
    const since = new Date(Date.now() - rule.windowMs);
    const [row] = await db
      .select({ value: sql<number>`count(*)` })
      .from(demoGenerationAttempts)
      .where(
        and(
          eq(demoGenerationAttempts.identityType, rule.identityType),
          eq(demoGenerationAttempts.identityHash, rule.identityHash),
          gte(demoGenerationAttempts.createdAt, since)
        )
      );

    if (Number(row?.value ?? 0) >= rule.max) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
        code: "RATE_LIMIT_EXCEEDED"
      };
    }
  }

  return { allowed: true };
}

export async function recordRateLimitAttempts(attempts: RateLimitAttempt[]) {
  if (!attempts.length) {
    return;
  }

  const now = new Date();

  await db.insert(demoGenerationAttempts).values(
    attempts.map((attempt) => ({
      id: crypto.randomUUID(),
      identityType: attempt.identityType,
      identityHash: attempt.identityHash,
      createdAt: now
    }))
  );
}
