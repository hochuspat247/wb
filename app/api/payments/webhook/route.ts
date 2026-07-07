import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { amountToMinorUnits, applyVerifiedPayment } from "@/lib/server/payments";
import { handleVideoPaymentWebhook } from "@/lib/server/videoPayment";
import { getYooKassaPayment } from "@/lib/server/yookassa";

export const runtime = "nodejs";

type YooKassaNotification = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
  };
};

export async function POST(request: Request) {
  const notification = (await request.json().catch(() => null)) as YooKassaNotification | null;
  const paymentId = notification?.object?.id;

  if (!paymentId) {
    return NextResponse.json({ error: "Payment id is required" }, { status: 400 });
  }

  try {
    const localPayment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId)
    });

    if (!localPayment) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const verifiedPayment = await getYooKassaPayment(paymentId);
    const videoResult = await handleVideoPaymentWebhook(verifiedPayment);

    if (videoResult.handled) {
      return NextResponse.json({
        ok: true,
        event: notification?.event,
        videoOrderId: videoResult.orderId,
        videoStatus: videoResult.status
      });
    }

    const verifiedAmount = amountToMinorUnits(verifiedPayment.amount.value);

    if (
      verifiedPayment.metadata?.userId !== localPayment.userId ||
      verifiedAmount !== localPayment.amount ||
      verifiedPayment.amount.currency !== localPayment.currency
    ) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 409 });
    }

    const result = await applyVerifiedPayment(verifiedPayment);

    return NextResponse.json({
      ok: true,
      event: notification?.event,
      credited: result.credited
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
