import type { NextRequest } from "next/server";

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
