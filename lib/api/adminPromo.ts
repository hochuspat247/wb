import type { AdminProductId } from "@/lib/admin/products";
import type { PromoCodeRecord } from "@/types/promo";

export class AdminPromoApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AdminPromoApiError";
    this.code = code;
  }
}

export async function fetchAdminPromoCodes(options?: {
  status?: "active" | "redeemed";
  product?: AdminProductId;
}) {
  const params = new URLSearchParams();

  if (options?.status) {
    params.set("status", options.status);
  }

  if (options?.product) {
    params.set("product", options.product);
  }

  const query = params.toString();
  const response = await fetch(`/api/admin/promo-codes${query ? `?${query}` : ""}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new AdminPromoApiError("Не удалось загрузить промокоды.");
  }

  const data = (await response.json()) as { codes: PromoCodeRecord[] };
  return data.codes;
}

export async function createAdminPromoCode(input: {
  assignedEmail: string;
  product: AdminProductId;
  note?: string;
}) {
  const response = await fetch("/api/admin/promo-codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as { promo?: PromoCodeRecord; error?: string; code?: string };

  if (!response.ok) {
    throw new AdminPromoApiError(data.error || "Не удалось создать промокод.", data.code);
  }

  return data.promo!;
}

export async function revokeAdminPromoCode(id: string) {
  const response = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
    throw new AdminPromoApiError(data?.error || "Не удалось удалить промокод.", data?.code);
  }
}
