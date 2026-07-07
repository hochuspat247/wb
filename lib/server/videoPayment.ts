import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import type { YooKassaPayment } from "@/lib/server/yookassa";
import {
  cancelVideoOrder,
  markVideoOrderPaid,
  startPaidKlingVideoGeneration
} from "@/lib/server/videoOrders";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function handleVideoPaymentWebhook(payment: YooKassaPayment) {
  const orderId = payment.metadata?.videoOrderId;

  if (!orderId) {
    return { handled: false as const };
  }

  const isSucceeded = payment.status === "succeeded" && payment.paid;

  if (!isSucceeded) {
    await cancelVideoOrder(orderId);
    return { handled: true as const, orderId, status: "cancelled" as const };
  }

  await markVideoOrderPaid(orderId, payment.id);
  await startPaidKlingVideoGeneration(orderId, getSiteUrl());

  return { handled: true as const, orderId, status: "paid" as const };
}

export async function recordVideoPayment(input: {
  payment: YooKassaPayment;
  userId: string;
  amountRub: number;
  orderId: string;
  idempotenceKey: string;
}) {
  const confirmationUrl = input.payment.confirmation?.confirmation_url;

  await db.insert(payments).values({
    id: input.payment.id,
    userId: input.userId,
    status: input.payment.status,
    amount: Math.round(input.amountRub * 100),
    currency: input.payment.amount.currency,
    credits: 0,
    paid: input.payment.paid,
    confirmationUrl,
    idempotenceKey: input.idempotenceKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
