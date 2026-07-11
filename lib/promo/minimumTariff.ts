import type { AdminProductId } from "@/lib/admin/products";

export const PROMO_MINIMUM_CREDITS: Record<AdminProductId, number> = {
  marketcard: 1,
  storystudio: 1,
  kvartovid: 1
};

export const PROMO_PRODUCT_PREFIX: Record<AdminProductId, string> = {
  marketcard: "MC",
  storystudio: "SS",
  kvartovid: "KV"
};

export function getPromoMinimumCredits(product: AdminProductId) {
  return PROMO_MINIMUM_CREDITS[product];
}
