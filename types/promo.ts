import type { AdminProductId } from "@/lib/admin/products";
import type { UserQuota } from "@/lib/server/quota";

export type PromoCodeStatus = "active" | "redeemed";

export type PromoCodeRecord = {
  id: string;
  code: string;
  assignedEmail: string;
  assignedUserId: string | null;
  product: AdminProductId;
  credits: number;
  note: string | null;
  createdAt: string;
  redeemedAt: string | null;
  redeemedByUserId: string | null;
  status: PromoCodeStatus;
};

export type PromoRedeemErrorCode =
  | "INVALID_CODE"
  | "EMAIL_MISMATCH"
  | "ALREADY_REDEEMED"
  | "EXPIRED"
  | "PLACEHOLDER_EMAIL"
  | "PRODUCT_MISMATCH"
  | "UNAUTHORIZED";

export type PromoRedeemResult = {
  ok: true;
  creditsGranted: number;
  product: AdminProductId;
  quota: UserQuota;
};
