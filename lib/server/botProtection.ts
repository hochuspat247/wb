import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/server/clientIp";
import {
  enforceRateLimits,
  hashRateLimitIdentity,
  recordRateLimitAttempts,
  type RateLimitResult
} from "@/lib/server/rateLimit";

export type AntiBotPayload = {
  honeypot?: string;
  formStartedAt?: number;
};

export type AntiBotVerifyResult =
  | { ok: true }
  | { ok: false; code: "BOT_DETECTED" | "FORM_TOO_FAST" | "RATE_LIMIT_EXCEEDED"; retryAfterSeconds?: number };

type ProtectionErrorInput =
  | AntiBotVerifyResult
  | RateLimitResult
  | { code?: string; retryAfterSeconds?: number };

function isBotProtectionEnabled() {
  return process.env.BOT_PROTECTION_ENABLED === "true";
}

export function isObviousAutomatedClient(request: NextRequest | Request) {
  if (!isBotProtectionEnabled()) {
    return false;
  }

  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  if (!userAgent) {
    return true;
  }

  const suspiciousFragments = [
    "bot",
    "crawler",
    "spider",
    "headless",
    "curl/",
    "wget/",
    "python-requests",
    "scrapy",
    "httpclient"
  ];

  return suspiciousFragments.some((fragment) => userAgent.includes(fragment));
}

export function buildClientFingerprint(request: Request) {
  const parts = [
    request.headers.get("user-agent") || "",
    request.headers.get("accept-language") || "",
    request.headers.get("sec-ch-ua") || "",
    request.headers.get("sec-ch-ua-platform") || ""
  ];

  return hashRateLimitIdentity(parts.join("|"));
}

export async function enforceIpRateLimit(action: string, request: Request, windowMs: number, max: number): Promise<RateLimitResult> {
  if (!isBotProtectionEnabled()) {
    return { allowed: true };
  }

  const ipHash = hashRateLimitIdentity(getClientIp(request));

  return enforceRateLimits([
    {
      identityType: `ip_${action}`,
      identityHash: ipHash,
      windowMs,
      max
    }
  ]);
}

export async function recordIpRateLimitAttempt(action: string, request: Request) {
  if (!isBotProtectionEnabled()) {
    return;
  }

  const ipHash = hashRateLimitIdentity(getClientIp(request));

  await recordRateLimitAttempts([
    {
      identityType: `ip_${action}`,
      identityHash: ipHash
    }
  ]);
}

export async function verifyAntiBotRequest(_request: Request, payload: AntiBotPayload): Promise<AntiBotVerifyResult> {
  if (!isBotProtectionEnabled()) {
    return { ok: true };
  }

  if (payload.honeypot?.trim()) {
    return { ok: false, code: "BOT_DETECTED" };
  }

  const minFormAgeMs = Number.parseInt(process.env.BOT_MIN_FORM_AGE_MS || "2500", 10) || 2500;

  if (payload.formStartedAt && Date.now() - payload.formStartedAt < minFormAgeMs) {
    return { ok: false, code: "FORM_TOO_FAST" };
  }

  return { ok: true };
}

export function botProtectionErrorResponse(result: ProtectionErrorInput, status?: number) {
  const code = "code" in result ? result.code : undefined;
  const retryAfterSeconds = "retryAfterSeconds" in result ? result.retryAfterSeconds : undefined;

  let message = "Слишком много запросов. Попробуйте позже.";
  let httpStatus = status ?? 429;

  if (code === "BOT_DETECTED" || code === "FORM_TOO_FAST") {
    message = "Запрос отклонён. Обновите страницу и попробуйте снова.";
    httpStatus = status ?? 403;
  }

  const headers: Record<string, string> = {};

  if (retryAfterSeconds) {
    headers["Retry-After"] = String(retryAfterSeconds);
  }

  return NextResponse.json(
    {
      error: message,
      code: code || "RATE_LIMIT_EXCEEDED"
    },
    {
      status: httpStatus,
      headers
    }
  );
}
