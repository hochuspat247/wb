import type { CreateKvartovidVideoInput, KvartovidListingInput, KvartovidListingResult } from "@/types/kvartovid";
import type { CreateVideoOrderResponse } from "@/types/video-generation";
import { fetchVideoOrderStatus } from "@/lib/api/video";

type ListingQuota = {
  canGenerate?: boolean;
  generationsUsed?: number;
  generationCredits?: number;
};

export async function generateKvartovidListing(
  input: KvartovidListingInput
): Promise<KvartovidListingResult & { quota?: ListingQuota }> {
  const response = await fetch("/api/kvartovid/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as KvartovidListingResult & {
    error?: string;
    code?: string;
    quota?: ListingQuota;
  };

  if (!response.ok) {
    const error = new Error(data.error || "Не удалось сгенерировать объявление.") as Error & { code?: string };
    error.code = data.code;
    throw error;
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

  const data = (await response.json()) as CreateVideoOrderResponse & { error?: string; code?: string };

  if (!response.ok) {
    const error = new Error(data.error || "Не удалось создать заказ на видео.") as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  return data;
}

export { fetchVideoOrderStatus };

export async function fetchKvartovidListings() {
  const response = await fetch("/api/kvartovid/listings", { cache: "no-store" });
  const data = (await response.json()) as { listings?: import("@/types/kvartovid").KvartovidSavedListing[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось загрузить объявления.");
  }

  return data.listings ?? [];
}

export async function deleteKvartovidListing(listingId: string) {
  const response = await fetch(`/api/kvartovid/listings/${listingId}`, { method: "DELETE" });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось удалить объявление.");
  }
}

