import * as VKID from "@vkid/sdk";
import { BRAND } from "@/lib/branding";

const CALLBACK_STORAGE_KEY = "mc_vk_callback";

let initialized = false;
let initFailed = false;
let consoleFilterInstalled = false;

function isBenignVkNetworkError(error: unknown) {
  if (!error) return false;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : String(error);

  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

/** VK SDK пишет в console.error падения трекера (CORS/localhost) — Next Dev Overlay показывает это как TypeError. */
function installVkConsoleFilter() {
  if (typeof window === "undefined" || consoleFilterInstalled) {
    return;
  }

  consoleFilterInstalled = true;
  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    if (args.some((arg) => isBenignVkNetworkError(arg))) {
      return;
    }
    originalError(...args);
  };
}

export function storeVkCallbackUrl(callbackUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(CALLBACK_STORAGE_KEY, callbackUrl);
}

export function readVkCallbackUrl() {
  if (typeof window === "undefined") {
    return "/cabinet";
  }

  return sessionStorage.getItem(CALLBACK_STORAGE_KEY) || "/cabinet";
}

export function getVkIdRedirectUrl() {
  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // Prefer registered production redirect for local widget boot when provided.
      // Actual callback still works via Code flow if localhost is also trusted in VK app.
      return process.env.NEXT_PUBLIC_VK_REDIRECT_URL || `${origin}/`;
    }
  }

  if (process.env.NEXT_PUBLIC_VK_REDIRECT_URL) {
    return process.env.NEXT_PUBLIC_VK_REDIRECT_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/`;
  }

  return "https://marketcard-ai.avenir-team.ru/";
}

export function getVkAppId() {
  return process.env.NEXT_PUBLIC_VK_APP_ID;
}

export function getVkAppName() {
  return process.env.NEXT_PUBLIC_VK_APP_NAME || BRAND.marketCard;
}

export function getVkIdScope() {
  return process.env.NEXT_PUBLIC_VK_SCOPE || "email";
}

export function initVkIdConfig() {
  const appId = getVkAppId();

  if (!appId || initFailed) {
    return false;
  }

  installVkConsoleFilter();

  const redirectUrl = getVkIdRedirectUrl();

  if (!initialized) {
    try {
      VKID.Config.init({
        app: Number(appId),
        redirectUrl,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: getVkIdScope()
      });
      initialized = true;
    } catch (error) {
      if (!isBenignVkNetworkError(error)) {
        console.warn("VK ID config init failed:", error);
      }
      initFailed = true;
      return false;
    }
  }

  return true;
}

export function clearVkAuthParamsFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const authParams = ["code", "device_id", "state", "type", "expires_in", "ext_id"];

  let changed = false;
  for (const param of authParams) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (changed) {
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }
}

export async function completeVkIdLogin(payload: { code: string; device_id: string }) {
  if (!initVkIdConfig()) {
    throw new Error("VK ID не инициализирован");
  }
  const tokenData = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
  return tokenData.access_token;
}
