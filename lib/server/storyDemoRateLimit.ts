import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoStories } from "@/lib/db/schema";
import { buildClientFingerprint } from "@/lib/server/botProtection";
import { hashDemoClientIp } from "@/lib/server/demoRateLimit";
import {
  enforceRateLimits,
  hashRateLimitIdentity,
  recordRateLimitAttempts
} from "@/lib/server/rateLimit";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type StoryDemoRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      error: string;
      code: "DEMO_LIMIT_EXCEEDED" | "RATE_LIMIT_EXCEEDED";
      retryAfterSeconds: number;
    };

export async function checkGuestStoryDemoAllowed(request: Request, guestId: string): Promise<StoryDemoRateLimitResult> {
  const sinceMs = ONE_DAY_MS;
  const dailyGuestLimit = getPositiveIntegerEnv("STORY_DEMO_DAILY_LIMIT", 1);
  const dailyIpLimit = getPositiveIntegerEnv("STORY_DEMO_IP_DAILY_LIMIT", 3);
  const dailyAttemptLimit = getPositiveIntegerEnv("STORY_DEMO_ATTEMPT_DAILY_LIMIT", 3);
  const dailyIpAttemptLimit = getPositiveIntegerEnv("STORY_DEMO_IP_ATTEMPT_DAILY_LIMIT", 10);
  const dailyFingerprintLimit = getPositiveIntegerEnv("STORY_DEMO_FINGERPRINT_DAILY_LIMIT", 3);

  const clientIpHash = hashDemoClientIp(request);
  const fingerprintHash = buildClientFingerprint(request);

  const attemptLimit = await enforceRateLimits([
    {
      identityType: "story_demo_guest_attempt",
      identityHash: hashRateLimitIdentity(guestId),
      windowMs: sinceMs,
      max: dailyAttemptLimit
    },
    {
      identityType: "story_demo_ip_attempt",
      identityHash: clientIpHash,
      windowMs: sinceMs,
      max: dailyIpAttemptLimit
    },
    {
      identityType: "story_demo_fingerprint_attempt",
      identityHash: fingerprintHash,
      windowMs: sinceMs,
      max: dailyFingerprintLimit
    }
  ]);

  if (!attemptLimit.allowed) {
    return {
      allowed: false,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: attemptLimit.retryAfterSeconds,
      error: "Слишком много попыток. Попробуйте позже или зарегистрируйтесь, чтобы продолжить."
    };
  }

  const since = new Date(Date.now() - sinceMs);

  const [guestCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoStories)
    .where(and(eq(demoStories.guestId, guestId), gte(demoStories.createdAt, since)));

  if (Number(guestCount?.value ?? 0) >= dailyGuestLimit) {
    return buildLimitError();
  }

  const [ipCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoStories)
    .where(and(eq(demoStories.clientIpHash, clientIpHash), gte(demoStories.createdAt, since)));

  if (Number(ipCount?.value ?? 0) >= dailyIpLimit) {
    return buildLimitError();
  }

  return { allowed: true };
}

export async function recordGuestStoryDemoAttempt(request: Request, guestId: string) {
  const clientIpHash = hashDemoClientIp(request);
  const fingerprintHash = buildClientFingerprint(request);

  await recordRateLimitAttempts([
    { identityType: "story_demo_guest_attempt", identityHash: hashRateLimitIdentity(guestId) },
    { identityType: "story_demo_ip_attempt", identityHash: clientIpHash },
    { identityType: "story_demo_fingerprint_attempt", identityHash: fingerprintHash }
  ]);
}

function buildLimitError(): StoryDemoRateLimitResult {
  return {
    allowed: false,
    code: "DEMO_LIMIT_EXCEEDED",
    retryAfterSeconds: Math.ceil(ONE_DAY_MS / 1000),
    error: "Бесплатное демо уже использовано. Зарегистрируйтесь, чтобы продолжить работу над историей."
  };
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
