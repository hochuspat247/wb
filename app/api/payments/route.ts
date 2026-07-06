import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { calculatePackagePrice } from "@/lib/pricing";
import { amountToMinorUnits } from "@/lib/server/payments";
import { createYooKassaPayment } from "@/lib/server/yookassa";

export const runtime = "nodejs";

type CreatePaymentBody = {
  count?: number;
};

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreatePaymentBody;
  const count = Number(body.count);

  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return NextResponse.json({ error: "Invalid package size" }, { status: 400 });
  }

  const price = calculatePackagePrice(count);
  const idempotenceKey = crypto.randomUUID();
  const siteUrl = getSiteUrl(request);

  try {
    const payment = await createYooKassaPayment({
      amount: price.total,
      credits: count,
      description: `MarketCard AI: ${count} generations`,
      idempotenceKey,
      returnUrl: `${siteUrl}/cabinet?payment=return`,
      userId
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;

    if (!confirmationUrl) {
      return NextResponse.json({ error: "Payment confirmation URL is missing" }, { status: 502 });
    }

    await db.insert(payments).values({
      id: payment.id,
      userId,
      status: payment.status,
      amount: amountToMinorUnits(payment.amount.value),
      currency: payment.amount.currency,
      credits: count,
      paid: payment.paid,
      confirmationUrl,
      idempotenceKey,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      confirmationUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment creation failed";
    const status = message === "YOOKASSA_CREDENTIALS_MISSING" ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
