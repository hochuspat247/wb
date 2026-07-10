import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerations } from "@/lib/db/schema";
import { buildClientFingerprint } from "@/lib/server/botProtection";
import { getClientIp } from "@/lib/server/clientIp";
import {
  enforceRateLimits,
  hashRateLimitIdentity,
  recordRateLimitAttempts,
  type RateLimitResult
} from "@/lib/server/rateLimit";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type DemoRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      error: string;
      code: "DEMO_LIMIT_EXCEEDED" | "RATE_LIMIT_EXCEEDED";
      retryAfterSeconds: number;
    };

export function hashDemoClientIp(request: Request) {
  return hashRateLimitIdentity(getClientIp(request));
}

export async function checkGuestDemoGenerationAllowed(request: Request, guestId: string): Promise<DemoRateLimitResult> {
  const sinceMs = ONE_DAY_MS;
  const dailyGuestLimit = getPositiveIntegerEnv("DEMO_FREE_DAILY_LIMIT", 1);
  const dailyIpLimit = getPositiveIntegerEnv("DEMO_FREE_IP_DAILY_LIMIT", 5);
  const dailyAttemptLimit = getPositiveIntegerEnv("DEMO_ATTEMPT_DAILY_LIMIT", 3);
  const dailyIpAttemptLimit = getPositiveIntegerEnv("DEMO_IP_ATTEMPT_DAILY_LIMIT", 10);
  const dailyFingerprintLimit = getPositiveIntegerEnv("DEMO_FREE_FINGERPRINT_DAILY_LIMIT", 3);

  const clientIpHash = hashDemoClientIp(request);
  const fingerprintHash = buildClientFingerprint(request);

  const attemptLimit = await enforceRateLimits([
    { identityType: "demo_guest_attempt", identityHash: hashRateLimitIdentity(guestId), windowMs: sinceMs, max: dailyAttemptLimit },
    { identityType: "demo_ip_attempt", identityHash: clientIpHash, windowMs: sinceMs, max: dailyIpAttemptLimit },
    {
      identityType: "demo_fingerprint_attempt",
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
      error: "Слишком много попыток демо-генерации. Попробуйте позже или войдите в аккаунт."
    };
  }

  const since = new Date(Date.now() - sinceMs);

  const [guestCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoGenerations)
    .where(and(eq(demoGenerations.guestId, guestId), gte(demoGenerations.createdAt, since)));

  if (Number(guestCount?.value ?? 0) >= dailyGuestLimit) {
    return buildSuccessLimitError();
  }

  const [ipCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoGenerations)
    .where(and(eq(demoGenerations.clientIpHash, clientIpHash), gte(demoGenerations.createdAt, since)));

  if (Number(ipCount?.value ?? 0) >= dailyIpLimit) {
    return buildSuccessLimitError();
  }

  return { allowed: true };
}

export async function recordGuestDemoAttempt(request: Request, guestId: string) {
  const clientIpHash = hashDemoClientIp(request);
  const fingerprintHash = buildClientFingerprint(request);

  await recordRateLimitAttempts([
    { identityType: "demo_guest_attempt", identityHash: hashRateLimitIdentity(guestId) },
    { identityType: "demo_ip_attempt", identityHash: clientIpHash },
    { identityType: "demo_fingerprint_attempt", identityHash: fingerprintHash }
  ]);
}

/** @deprecated Limits are recorded on demo attempts and successful demo_generation rows */
export async function commitGuestDemoGeneration(_request: Request, _guestId: string) {
  return;
}

function buildSuccessLimitError(): DemoRateLimitResult {
  return {
    allowed: false,
    code: "DEMO_LIMIT_EXCEEDED",
    retryAfterSeconds: Math.ceil(ONE_DAY_MS / 1000),
    error: "Бесплатная демо-генерация уже использована. Войдите в аккаунт или пополните баланс, чтобы продолжить."
  };
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
