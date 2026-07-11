import type { AdminProductId } from "@/lib/admin/products";
import type { PromoRedeemResult } from "@/types/promo";

export class PromoApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "PromoApiError";
    this.code = code;
  }
}

export async function redeemPromoCode(code: string, product: AdminProductId): Promise<PromoRedeemResult & {
  quota: PromoRedeemResult["quota"] & {
    cleanDownloadGenerationId?: string | null;
    downloadsFullyUnlocked?: boolean;
  };
}> {
  const response = await fetch("/api/promo-codes/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, product })
  });

  const data = (await response.json()) as PromoRedeemResult & {
    error?: string;
    code?: string;
    quota?: PromoRedeemResult["quota"] & {
      cleanDownloadGenerationId?: string | null;
      downloadsFullyUnlocked?: boolean;
    };
  };

  if (!response.ok) {
    throw new PromoApiError(data.error || "Не удалось активировать промокод.", data.code);
  }

  return data;
}
