import { createHash, randomUUID } from "crypto";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerationAttempts } from "@/lib/db/schema";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_AFTER_MS = 3 * ONE_DAY_MS;

export type DemoRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      error: string;
      code: "DEMO_LIMIT_EXCEEDED";
      retryAfterSeconds: number;
    };

type LimitIdentity = {
  type: string;
  hash: string;
  limit: number;
};

export async function reserveGuestDemoGeneration(request: Request, guestId: string): Promise<DemoRateLimitResult> {
  const dailyGuestLimit = getPositiveIntegerEnv("DEMO_FREE_DAILY_LIMIT", 1);
  const dailyFingerprintLimit = getPositiveIntegerEnv("DEMO_FREE_FINGERPRINT_DAILY_LIMIT", 1);
  const dailyIpLimit = getPositiveIntegerEnv("DEMO_FREE_IP_DAILY_LIMIT", 5);

  const clientIp = getClientIp(request);
  const userAgent = normalizeHeader(request.headers.get("user-agent"), 220);
  const now = new Date();
  const since = new Date(now.getTime() - ONE_DAY_MS);
  const cleanupBefore = new Date(now.getTime() - CLEANUP_AFTER_MS);
  const identities: LimitIdentity[] = [
    {
      type: "guest",
      hash: hashIdentity(guestId),
      limit: dailyGuestLimit
    },
    {
      type: "fingerprint",
      hash: hashIdentity(`${clientIp}|${userAgent}`),
      limit: dailyFingerprintLimit
    },
    {
      type: "ip",
      hash: hashIdentity(clientIp),
      limit: dailyIpLimit
    }
  ];

  await db.delete(demoGenerationAttempts).where(lt(demoGenerationAttempts.createdAt, cleanupBefore));

  for (const identity of identities) {
    const used = await countRecentAttempts(identity, since);

    if (used >= identity.limit) {
      return {
        allowed: false,
        code: "DEMO_LIMIT_EXCEEDED",
        retryAfterSeconds: Math.ceil(ONE_DAY_MS / 1000),
        error:
          "Бесплатная демо-генерация уже использована. Войдите в аккаунт или пополните баланс, чтобы продолжить."
      };
    }
  }

  await db.insert(demoGenerationAttempts).values(
    identities.map((identity) => ({
      id: randomUUID(),
      identityType: identity.type,
      identityHash: identity.hash,
      createdAt: now
    }))
  );

  return { allowed: true };
}

async function countRecentAttempts(identity: LimitIdentity, since: Date) {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(demoGenerationAttempts)
    .where(
      and(
        eq(demoGenerationAttempts.identityType, identity.type),
        eq(demoGenerationAttempts.identityHash, identity.hash),
        gte(demoGenerationAttempts.createdAt, since)
      )
    );

  return Number(row?.value ?? 0);
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
