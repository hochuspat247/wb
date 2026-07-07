import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOwnedVideoOrder, refreshVideoOrderStatus } from "@/lib/server/videoOrders";
import { reconcilePendingVideoPayment } from "@/lib/server/videoPaymentReconcile";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  let owned = await getOwnedVideoOrder(orderId, userId);

  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (owned.status === "payment_pending") {
    await reconcilePendingVideoPayment(orderId);
    owned = (await getOwnedVideoOrder(orderId, userId)) || owned;
  }

  const order =
    owned.status === "queued" || owned.status === "processing" || owned.status === "paid"
      ? await refreshVideoOrderStatus(orderId)
      : owned;

  return NextResponse.json({
    orderId: order?.id || orderId,
    status: order?.status || owned.status,
    originalVideoUrl: order?.originalVideoUrl || null,
    error: order?.error || null
  });
}
