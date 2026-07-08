import { createHash } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerations } from "@/lib/db/schema";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type DemoRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      error: string;
      code: "DEMO_LIMIT_EXCEEDED";
      retryAfterSeconds: number;
    };

export function hashDemoClientIp(request: Request) {
  return hashIdentity(getClientIp(request));
}

export async function checkGuestDemoGenerationAllowed(request: Request, guestId: string): Promise<DemoRateLimitResult> {
  const since = new Date(Date.now() - ONE_DAY_MS);
  const dailyGuestLimit = getPositiveIntegerEnv("DEMO_FREE_DAILY_LIMIT", 1);
  const dailyIpLimit = getPositiveIntegerEnv("DEMO_FREE_IP_DAILY_LIMIT", 5);
  const clientIpHash = hashDemoClientIp(request);

  const [guestCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoGenerations)
    .where(and(eq(demoGenerations.guestId, guestId), gte(demoGenerations.createdAt, since)));

  if (Number(guestCount?.value ?? 0) >= dailyGuestLimit) {
    return buildLimitError();
  }

  const [ipCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoGenerations)
    .where(and(eq(demoGenerations.clientIpHash, clientIpHash), gte(demoGenerations.createdAt, since)));

  if (Number(ipCount?.value ?? 0) >= dailyIpLimit) {
    return buildLimitError();
  }

  return { allowed: true };
}

/** @deprecated Limits are recorded on successful demo_generation rows */
export async function commitGuestDemoGeneration(_request: Request, _guestId: string) {
  return;
}

function buildLimitError(): DemoRateLimitResult {
  return {
    allowed: false,
    code: "DEMO_LIMIT_EXCEEDED",
    retryAfterSeconds: Math.ceil(ONE_DAY_MS / 1000),
    error: "Бесплатная демо-генерация уже использована. Войдите в аккаунт или пополните баланс, чтобы продолжить."
  };
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return normalizeHeader(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      forwardedFor ||
      "unknown",
    80
  );
}

function normalizeHeader(value: string | null | undefined, maxLength: number) {
  const clean = (value || "unknown").replace(/\s+/g, " ").trim();
  return clean.slice(0, maxLength) || "unknown";
}

function hashIdentity(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "marketcard-demo-rate-limit";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
