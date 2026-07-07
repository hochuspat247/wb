import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOwnedVideoOrder } from "@/lib/server/videoOrders";

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
  const order = await getOwnedVideoOrder(orderId, userId);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status !== "done" || !order.originalVideoUrl) {
    return NextResponse.json({ error: "Video is not ready yet" }, { status: 409 });
  }

  return NextResponse.redirect(order.originalVideoUrl);
}
