"use client";

import type { RegistrationProduct, RegistrationSource } from "@/lib/auth/registrationMeta";
import { SIGNUP_PRODUCT_STORAGE_KEY, deriveRegistrationProduct } from "@/lib/auth/registrationMeta";

export const SIGNUP_CALLBACK_STORAGE_KEY = "mc_signup_callback";

export function storeLastVisitedProduct(pathname: string) {
  if (typeof window === "undefined") {
    return;
  }

  const product = deriveRegistrationProduct({ callbackUrl: pathname });
  if (product !== "unknown") {
    window.sessionStorage.setItem(SIGNUP_PRODUCT_STORAGE_KEY, product);
  }
}

export function readLastVisitedProduct(): RegistrationProduct | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const stored = window.sessionStorage.getItem(SIGNUP_PRODUCT_STORAGE_KEY);
  if (stored === "marketcard" || stored === "storystudio" || stored === "kvartovid") {
    return stored;
  }

  return undefined;
}

export function storeSignupCallbackUrl(callbackUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SIGNUP_CALLBACK_STORAGE_KEY, callbackUrl);

  const product = deriveRegistrationProduct({ callbackUrl });
  if (product !== "unknown") {
    window.sessionStorage.setItem(SIGNUP_PRODUCT_STORAGE_KEY, product);
  }
}

export function readSignupCallbackUrl(fallback = "/cabinet") {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.sessionStorage.getItem(SIGNUP_CALLBACK_STORAGE_KEY) || fallback;
}

export async function recordSignupContext(input?: {
  callbackUrl?: string;
  referrer?: string;
  fromDemo?: boolean;
  source?: RegistrationSource;
  product?: RegistrationProduct;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const callbackUrl = input?.callbackUrl ?? readSignupCallbackUrl();
  const fromDemo = input?.fromDemo ?? callbackUrl.includes("fromDemo");
  const product =
    input?.product ??
    readLastVisitedProduct() ??
    deriveRegistrationProduct({
      callbackUrl,
      referrer: input?.referrer ?? document.referrer
    });

  try {
    await fetch("/api/auth/signup-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callbackUrl,
        referrer: input?.referrer ?? document.referrer,
        fromDemo,
        source: input?.source,
        product: product !== "unknown" ? product : undefined
      })
    });
  } catch {
    // best-effort
  } finally {
    window.sessionStorage.removeItem(SIGNUP_CALLBACK_STORAGE_KEY);
    window.sessionStorage.removeItem(SIGNUP_PRODUCT_STORAGE_KEY);
  }
}
