import crypto from "crypto";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { AdminProductId } from "@/lib/admin/products";
import { isAdminProductId } from "@/lib/admin/products";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { promoCodes, users } from "@/lib/db/schema";
import { getPromoMinimumCredits, PROMO_PRODUCT_PREFIX } from "@/lib/promo/minimumTariff";
import { unlockAllDownloadsForUser } from "@/lib/server/downloadAccess";
import { addGenerationCredits, getUserQuota } from "@/lib/server/quota";
import type { PromoCodeRecord, PromoRedeemErrorCode, PromoRedeemResult } from "@/types/promo";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class PromoCodeError extends Error {
  code: PromoRedeemErrorCode | "DUPLICATE_ACTIVE" | "NOT_FOUND" | "INVALID_EMAIL" | "ALREADY_REDEEMED";

  constructor(message: string, code: PromoCodeError["code"]) {
    super(message);
    this.name = "PromoCodeError";
    this.code = code;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePromoCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function randomCodePart(length: number) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

function buildPromoCode(product: AdminProductId) {
  const prefix = PROMO_PRODUCT_PREFIX[product];
  return `${prefix}-${randomCodePart(4)}-${randomCodePart(4)}`;
}

function toRecord(row: typeof promoCodes.$inferSelect): PromoCodeRecord {
  return {
    id: row.id,
    code: row.code,
    assignedEmail: row.assignedEmail,
    assignedUserId: row.assignedUserId ?? null,
    product: row.product,
    credits: row.credits,
    note: row.note ?? null,
    createdAt: row.createdAt.toISOString(),
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    redeemedByUserId: row.redeemedByUserId ?? null,
    status: row.redeemedAt ? "redeemed" : "active"
  };
}

async function generateUniquePromoCode(product: AdminProductId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = buildPromoCode(product);
    const existing = await db.query.promoCodes.findFirst({
      where: eq(promoCodes.code, code),
      columns: { id: true }
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Failed to generate unique promo code");
}

export async function listPromoCodes(options?: {
  status?: "active" | "redeemed";
  product?: AdminProductId;
  limit?: number;
}) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const filters = [];

  if (options?.status === "active") {
    filters.push(isNull(promoCodes.redeemedAt));
  } else if (options?.status === "redeemed") {
    filters.push(isNotNull(promoCodes.redeemedAt));
  }

  if (options?.product) {
    filters.push(eq(promoCodes.product, options.product));
  }

  const rows = await db.query.promoCodes.findMany({
    where: filters.length ? and(...filters) : undefined,
    orderBy: [desc(promoCodes.createdAt)],
    limit
  });

  return rows.map(toRecord);
}

export async function createPromoCode(input: {
  assignedEmail: string;
  product: AdminProductId;
  note?: string | null;
}) {
  const assignedEmail = normalizeEmail(input.assignedEmail);

  if (!assignedEmail || !assignedEmail.includes("@")) {
    throw new PromoCodeError("Укажите корректный email пользователя.", "INVALID_EMAIL");
  }

  const existingActive = await db.query.promoCodes.findFirst({
    where: and(
      eq(promoCodes.assignedEmail, assignedEmail),
      eq(promoCodes.product, input.product),
      isNull(promoCodes.redeemedAt)
    ),
    columns: { id: true, code: true }
  });

  if (existingActive) {
    throw new PromoCodeError(
      "У этого пользователя уже есть активный промокод для выбранного сервиса.",
      "DUPLICATE_ACTIVE"
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, assignedEmail),
    columns: { id: true }
  });

  const credits = getPromoMinimumCredits(input.product);
  const code = await generateUniquePromoCode(input.product);
  const now = new Date();

  const [created] = await db
    .insert(promoCodes)
    .values({
      code,
      assignedEmail,
      assignedUserId: user?.id ?? null,
      product: input.product,
      credits,
      note: input.note?.trim() || null,
      createdAt: now
    })
    .returning();

  return toRecord(created);
}

export async function revokePromoCode(id: string) {
  const existing = await db.query.promoCodes.findFirst({
    where: eq(promoCodes.id, id)
  });

  if (!existing) {
    throw new PromoCodeError("Промокод не найден.", "NOT_FOUND");
  }

  if (existing.redeemedAt) {
    throw new PromoCodeError("Использованный промокод нельзя удалить.", "ALREADY_REDEEMED");
  }

  await db.delete(promoCodes).where(eq(promoCodes.id, id));
}

export async function redeemPromoCode(input: {
  userId: string;
  userEmail: string;
  code: string;
  product: AdminProductId;
}): Promise<PromoRedeemResult> {
  const normalizedCode = normalizePromoCode(input.code);
  const normalizedEmail = normalizeEmail(input.userEmail);

  if (!normalizedCode) {
    throw new PromoCodeError("Введите промокод.", "INVALID_CODE");
  }

  if (isPlaceholderOAuthEmail(normalizedEmail)) {
    throw new PromoCodeError(
      "Укажите email в профиле — промокод привязан к вашему адресу.",
      "PLACEHOLDER_EMAIL"
    );
  }

  if (!isAdminProductId(input.product)) {
    throw new PromoCodeError("Неверный сервис.", "PRODUCT_MISMATCH");
  }

  const promo = await db.query.promoCodes.findFirst({
    where: eq(promoCodes.code, normalizedCode)
  });

  if (!promo) {
    throw new PromoCodeError("Промокод не найден.", "INVALID_CODE");
  }

  if (promo.redeemedAt) {
    throw new PromoCodeError("Этот промокод уже был использован.", "ALREADY_REDEEMED");
  }

  if (promo.product !== input.product) {
    throw new PromoCodeError("Промокод предназначен для другого сервиса.", "PRODUCT_MISMATCH");
  }

  if (promo.assignedEmail !== normalizedEmail) {
    throw new PromoCodeError("Промокод выдан другому пользователю.", "EMAIL_MISMATCH");
  }

  if (promo.assignedUserId && promo.assignedUserId !== input.userId) {
    throw new PromoCodeError("Промокод выдан другому пользователю.", "EMAIL_MISMATCH");
  }

  const now = new Date();
  const redeemed = await db
    .update(promoCodes)
    .set({
      redeemedAt: now,
      redeemedByUserId: input.userId,
      assignedUserId: promo.assignedUserId ?? input.userId
    })
    .where(and(eq(promoCodes.id, promo.id), isNull(promoCodes.redeemedAt)))
    .returning({ id: promoCodes.id });

  if (!redeemed.length) {
    throw new PromoCodeError("Этот промокод уже был использован.", "ALREADY_REDEEMED");
  }

  await addGenerationCredits(input.userId, promo.credits);
  await unlockAllDownloadsForUser(input.userId);

  const quota = await getUserQuota(input.userId);

  return {
    ok: true,
    creditsGranted: promo.credits,
    product: promo.product,
    quota
  };
}
