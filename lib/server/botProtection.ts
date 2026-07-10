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
  smartCaptchaToken?: string;
  honeypot?: string;
  formStartedAt?: number;
};

export type AntiBotVerifyResult =
  | { ok: true }
  | { ok: false; code: "BOT_DETECTED" | "CAPTCHA_FAILED" | "FORM_TOO_FAST" | "RATE_LIMIT_EXCEEDED"; retryAfterSeconds?: number };

type ProtectionErrorInput =
  | AntiBotVerifyResult
  | RateLimitResult
  | { code?: string; retryAfterSeconds?: number };

function isBotProtectionEnabled() {
  return process.env.BOT_PROTECTION_ENABLED === "true";
}

function isCaptchaRequired() {
  return process.env.BOT_PROTECTION_REQUIRE_CAPTCHA === "true" && Boolean(process.env.YANDEX_SMARTCAPTCHA_SERVER_KEY?.trim());
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

export async function verifyAntiBotRequest(request: Request, payload: AntiBotPayload): Promise<AntiBotVerifyResult> {
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

  if (!isCaptchaRequired()) {
    return { ok: true };
  }

  const token = payload.smartCaptchaToken?.trim();

  if (!token) {
    return { ok: false, code: "CAPTCHA_FAILED" };
  }

  const valid = await validateSmartCaptchaToken(token, getClientIp(request));

  if (!valid) {
    return { ok: false, code: "CAPTCHA_FAILED" };
  }

  return { ok: true };
}

export function botProtectionErrorResponse(result: ProtectionErrorInput, status?: number) {
  const code = "code" in result ? result.code : undefined;
  const retryAfterSeconds = "retryAfterSeconds" in result ? result.retryAfterSeconds : undefined;

  let message = "Слишком много запросов. Попробуйте позже.";
  let httpStatus = status ?? 429;

  if (code === "CAPTCHA_FAILED") {
    message = "Подтвердите, что вы не робот.";
    httpStatus = status ?? 400;
  } else if (code === "BOT_DETECTED" || code === "FORM_TOO_FAST") {
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

async function validateSmartCaptchaToken(token: string, ip: string) {
  const secret = process.env.YANDEX_SMARTCAPTCHA_SERVER_KEY?.trim();

  if (!secret) {
    return true;
  }

  try {
    const body = new URLSearchParams({
      secret,
      token,
      ip
    });

    const response = await fetch("https://smartcaptcha.cloud.yandex.ru/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };

    return data.status === "ok";
  } catch {
    return false;
  }
}
