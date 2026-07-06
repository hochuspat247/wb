import * as VKID from "@vkid/sdk";

let initialized = false;

export function getVkIdRedirectUrl() {
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
  return process.env.NEXT_PUBLIC_VK_APP_NAME || "MarketCard AI";
}

export function initVkIdConfig() {
  const appId = getVkAppId();

  if (initialized || !appId) {
    return Boolean(appId);
  }

  VKID.Config.init({
    app: Number(appId),
    redirectUrl: getVkIdRedirectUrl(),
    responseMode: VKID.ConfigResponseMode.Callback,
    source: VKID.ConfigSource.LOWCODE,
    scope: ""
  });

  initialized = true;
  return true;
}

export async function completeVkIdLogin(payload: { code: string; device_id: string }) {
  const tokenData = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
  return tokenData.access_token;
}
