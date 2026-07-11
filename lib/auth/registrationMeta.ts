import type { AdminProductId } from "@/lib/admin/products";
import { belongsToAdminProduct, isAdminProductId } from "@/lib/admin/products";

export type RegistrationSource = "email" | "vk" | "yandex";
export type RegistrationProduct = AdminProductId | "unknown";
export type UserPlanTier = "free" | "pro" | "premium" | "unlimited";

export const SIGNUP_PRODUCT_STORAGE_KEY = "mc_signup_product";

export type SignupContextInput = {
  callbackUrl?: string;
  referrer?: string;
  fromDemo?: boolean;
  source?: RegistrationSource;
  product?: RegistrationProduct;
};

function productFromPath(path: string): RegistrationProduct | null {
  const normalized = path.split("?")[0] || path;

  if (normalized.startsWith("/register") || normalized.startsWith("/login")) {
    return null;
  }

  if (belongsToAdminProduct(normalized, "storystudio")) {
    return "storystudio";
  }

  if (belongsToAdminProduct(normalized, "kvartovid")) {
    return "kvartovid";
  }

  if (normalized === "/" || normalized.startsWith("/cabinet") || normalized.startsWith("/generations")) {
    return "marketcard";
  }

  if (belongsToAdminProduct(normalized, "marketcard")) {
    return "marketcard";
  }

  return null;
}

function extractNestedCallbackUrl(value: string) {
  try {
    const parsed = value.startsWith("http") ? new URL(value) : new URL(value, "https://local.test");
    const nested = parsed.searchParams.get("callbackUrl");
    return nested?.trim() || null;
  } catch {
    return null;
  }
}

export function deriveRegistrationProduct(input?: {
  callbackUrl?: string | null;
  referrer?: string | null;
  product?: RegistrationProduct | null;
}): RegistrationProduct {
  if (input?.product && isAdminProductId(input.product)) {
    return input.product;
  }

  const candidates = [input?.callbackUrl, extractNestedCallbackUrl(input?.callbackUrl ?? "")]
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const path = candidate.startsWith("http")
        ? new URL(candidate).pathname
        : candidate.split("?")[0];
      const product = productFromPath(path);
      if (product) {
        return product;
      }
    } catch {
      continue;
    }
  }

  if (input?.referrer?.trim()) {
    try {
      const refPath = new URL(input.referrer).pathname;
      const fromReferrer = productFromPath(refPath);
      if (fromReferrer && fromReferrer !== "marketcard") {
        return fromReferrer;
      }
    } catch {
      // ignore invalid referrer
    }
  }

  if (input?.callbackUrl?.trim()) {
    return "marketcard";
  }

  return "unknown";
}

export function resolveRegistrationProduct(input: {
  stored?: string | null;
  callbackUrl?: string | null;
  referrer?: string | null;
  hints?: {
    hasStory: boolean;
    hasKvartovid: boolean;
    hasMarketcard: boolean;
    hasStoryDemo: boolean;
    hasMarketcardDemo: boolean;
  };
}): { product: RegistrationProduct; origin: "saved" | "callback" | "inferred" } {
  if (input.stored === "marketcard" || input.stored === "storystudio" || input.stored === "kvartovid") {
    return { product: input.stored, origin: "saved" };
  }

  const fromCallback = deriveRegistrationProduct({
    callbackUrl: input.callbackUrl,
    referrer: input.referrer
  });

  if (fromCallback !== "unknown") {
    return { product: fromCallback, origin: "callback" };
  }

  const hints = input.hints;
  if (hints?.hasStoryDemo || (hints?.hasStory && !hints?.hasMarketcard && !hints?.hasKvartovid)) {
    return { product: "storystudio", origin: "inferred" };
  }

  if (hints?.hasMarketcardDemo || hints?.hasMarketcard) {
    return { product: "marketcard", origin: "inferred" };
  }

  if (hints?.hasKvartovid) {
    return { product: "kvartovid", origin: "inferred" };
  }

  if (hints?.hasStory) {
    return { product: "storystudio", origin: "inferred" };
  }

  return { product: "unknown", origin: "inferred" };
}

export function deriveFromDemo(callbackUrl?: string | null, explicit?: boolean) {
  if (explicit) {
    return true;
  }

  return Boolean(callbackUrl?.includes("fromDemo"));
}

export function inferRegistrationSource(input: {
  passwordHash?: string | null;
  providers: string[];
  storedSource?: string | null;
}): RegistrationSource | "unknown" {
  if (input.storedSource === "email" || input.storedSource === "vk" || input.storedSource === "yandex") {
    return input.storedSource;
  }

  if (input.passwordHash && !input.providers.length) {
    return "email";
  }

  if (input.providers.includes("vk") && !input.passwordHash) {
    return "vk";
  }

  if (input.providers.includes("yandex") && !input.passwordHash) {
    return "yandex";
  }

  if (input.passwordHash) {
    return "email";
  }

  if (input.providers.includes("vk")) {
    return "vk";
  }

  if (input.providers.includes("yandex")) {
    return "yandex";
  }

  return "unknown";
}

export function registrationSourceLabel(source: RegistrationSource | "unknown") {
  switch (source) {
    case "email":
      return "Email";
    case "vk":
      return "VK / Mail";
    case "yandex":
      return "Яндекс";
    default:
      return "—";
  }
}

export function registrationProductLabel(product: RegistrationProduct) {
  switch (product) {
    case "marketcard":
      return "MarketCard AI";
    case "storystudio":
      return "Story Studio";
    case "kvartovid":
      return "Kvartovid";
    default:
      return "Неизвестно";
  }
}

export function registrationProductOriginLabel(origin: "saved" | "callback" | "inferred") {
  switch (origin) {
    case "saved":
      return "зафиксировано";
    case "callback":
      return "по URL входа";
    case "inferred":
      return "по активности";
    default:
      return origin;
  }
}

export function planTierLabel(tier: UserPlanTier) {
  switch (tier) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "premium":
      return "Premium 18+";
    case "unlimited":
      return "Unlimited";
    default:
      return tier;
  }
}

export function truncateReferrer(value?: string | null, max = 120) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
