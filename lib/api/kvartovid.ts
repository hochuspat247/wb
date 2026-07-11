import type { CreateKvartovidVideoInput, KvartovidListingInput, KvartovidListingResult } from "@/types/kvartovid";
import type { KvartovidPaidPlanId } from "@/lib/kvartovid/pricing";
import type { CreateVideoOrderResponse } from "@/types/video-generation";
import { fetchVideoOrderStatus } from "@/lib/api/video";
import { KVARTOVID_GENERATION_ERROR, parseJsonResponse } from "@/lib/api/parseJsonResponse";

type ListingQuota = {
  canGenerate?: boolean;
  used?: number;
  remaining?: number;
  credits?: number;
  listingsCount?: number;
  freeListingsRemaining?: number;
  freeListingsLimit?: number;
  usesGlobalQuota?: boolean;
};

export class KvartovidApiError extends Error {
  code?: string;
  quota?: ListingQuota;

  constructor(message: string, options?: { code?: string; quota?: ListingQuota }) {
    super(message);
    this.name = "KvartovidApiError";
    this.code = options?.code;
    this.quota = options?.quota;
  }
}

export async function generateKvartovidListing(
  input: KvartovidListingInput
): Promise<KvartovidListingResult & { quota?: ListingQuota }> {
  const response = await fetch("/api/kvartovid/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = await parseJsonResponse<
    KvartovidListingResult & {
      error?: string;
      code?: string;
      quota?: ListingQuota;
    }
  >(response, KVARTOVID_GENERATION_ERROR);

  if (!response.ok) {
    throw new KvartovidApiError(data.error || KVARTOVID_GENERATION_ERROR, {
      code: data.code,
      quota: data.quota
    });
  }

  return data;
}

export async function createKvartovidVideoOrder(
  input: CreateKvartovidVideoInput & { useVideoCredit?: boolean; customerEmail?: string }
): Promise<CreateVideoOrderResponse & { error?: string; code?: string }> {
  const response = await fetch("/api/kvartovid/video/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = await parseJsonResponse<CreateVideoOrderResponse & { error?: string; code?: string }>(
    response,
    "Не удалось создать заказ на видео."
  );

  if (!response.ok) {
    const error = new Error(data.error || "Не удалось создать заказ на видео.") as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  return data;
}

export { fetchVideoOrderStatus };

export async function createKvartovidPayment(planId: KvartovidPaidPlanId, customerEmail?: string) {
  const response = await fetch("/api/kvartovid/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, customerEmail })
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    const data = await parseJsonResponse<{ code?: string; error?: string }>(
      response,
      "Не удалось создать платёж."
    ).catch(() => null);

    if (data?.code === "EMAIL_REQUIRED") {
      throw new Error("EMAIL_REQUIRED");
    }

    throw new Error(data?.error || "FAILED_TO_CREATE_PAYMENT");
  }

  return parseJsonResponse<{ id: string; confirmationUrl: string }>(response, "Не удалось создать платёж.");
}

export async function fetchKvartovidQuota() {
  const response = await fetch("/api/kvartovid/quota", { cache: "no-store" });
  const data = await parseJsonResponse<{ quota?: ListingQuota; error?: string }>(
    response,
    "Не удалось загрузить квоту."
  );

  if (!response.ok) {
    throw new Error(data.error || "Не удалось загрузить квоту.");
  }

  return data.quota ?? null;
}

export async function fetchKvartovidListings() {
  const response = await fetch("/api/kvartovid/listings", { cache: "no-store" });
  const data = await parseJsonResponse<{
    listings?: import("@/types/kvartovid").KvartovidSavedListing[];
    quota?: ListingQuota;
    error?: string;
  }>(response, "Не удалось загрузить объявления.");

  if (!response.ok) {
    throw new Error(data.error || "Не удалось загрузить объявления.");
  }

  return {
    listings: data.listings ?? [],
    quota: data.quota
  };
}

export async function deleteKvartovidListing(listingId: string) {
  const response = await fetch(`/api/kvartovid/listings/${listingId}`, { method: "DELETE" });
  const data = await parseJsonResponse<{ error?: string }>(response, "Не удалось удалить объявление.");

  if (!response.ok) {
    throw new Error(data.error || "Не удалось удалить объявление.");
  }
}

export async function updateKvartovidListingFloorPlan(
  listingId: string,
  payload: { floorPlanSvg: string; floorPlanLayout: import("@/types/kvartovid").KvartovidFloorPlanLayout }
) {
  const response = await fetch(`/api/kvartovid/listings/${listingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await parseJsonResponse<{
    listing?: import("@/types/kvartovid").KvartovidSavedListing;
    error?: string;
  }>(response, "Не удалось сохранить планировку.");

  if (!response.ok) {
    throw new Error(data.error || "Не удалось сохранить планировку.");
  }

  return data.listing;
}
