import type { AdminProductId } from "@/lib/admin/products";
import type { RegistrationProduct, RegistrationSource, UserPlanTier } from "@/lib/auth/registrationMeta";
import type { AdminUserListItem, AdminUsersByProduct } from "@/lib/server/adminUsers";

export class AdminUsersApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUsersApiError";
  }
}

export async function fetchAdminUsers(options?: {
  product?: AdminProductId | "";
  source?: RegistrationSource | "";
  tier?: UserPlanTier | "";
  fromDemo?: "" | "true" | "false";
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();

  if (options?.product) params.set("product", options.product);
  if (options?.source) params.set("source", options.source);
  if (options?.tier) params.set("tier", options.tier);
  if (options?.fromDemo) params.set("fromDemo", options.fromDemo);
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.dateFrom) params.set("dateFrom", options.dateFrom);
  if (options?.dateTo) params.set("dateTo", options.dateTo);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const query = params.toString();
  const response = await fetch(`/api/admin/users${query ? `?${query}` : ""}`, { cache: "no-store" });

  if (!response.ok) {
    throw new AdminUsersApiError("Не удалось загрузить пользователей.");
  }

  return response.json() as Promise<{ users: AdminUserListItem[]; total: number; byProduct: AdminUsersByProduct }>;
}

export type { AdminUserListItem, AdminUsersByProduct };
