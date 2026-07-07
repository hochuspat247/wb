import { NextResponse } from "next/server";
import { getYooKassaPayment } from "@/lib/server/yookassa";
import { handleVideoPaymentWebhook } from "@/lib/server/videoPayment";

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
    const verifiedPayment = await getYooKassaPayment(paymentId);
    const result = await handleVideoPaymentWebhook(verifiedPayment);

    if (!result.handled) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      status: result.status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
