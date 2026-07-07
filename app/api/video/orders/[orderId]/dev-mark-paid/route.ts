import { NextResponse } from "next/server";
import {
  getVideoOrderById,
  markVideoOrderPaid,
  startPaidKlingVideoGeneration
} from "@/lib/server/videoOrders";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { orderId } = await context.params;
  const order = await getVideoOrderById(orderId);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markVideoOrderPaid(orderId);
  await startPaidKlingVideoGeneration(orderId, getSiteUrl(_request));

  const updated = await getVideoOrderById(orderId);

  return NextResponse.json({
    orderId,
    status: updated?.status || "paid"
  });
}
