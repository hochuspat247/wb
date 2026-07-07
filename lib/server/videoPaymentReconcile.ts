import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { videoGenerationOrders } from "@/lib/db/schema";
import { getYooKassaPayment } from "@/lib/server/yookassa";
import { markVideoOrderPaid, startPaidKlingVideoGeneration } from "@/lib/server/videoOrders";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function reconcilePendingVideoPayment(orderId: string) {
  const row = await db.query.videoGenerationOrders.findFirst({
    where: eq(videoGenerationOrders.id, orderId)
  });

  if (!row || row.status !== "payment_pending" || !row.paymentId) {
    return null;
  }

  const payment = await getYooKassaPayment(row.paymentId);
  const isSucceeded = payment.status === "succeeded" && payment.paid;

  if (!isSucceeded) {
    return null;
  }

  await markVideoOrderPaid(orderId, payment.id);
  await startPaidKlingVideoGeneration(orderId, getSiteUrl());

  return orderId;
}
