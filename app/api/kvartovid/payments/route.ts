import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { getKvartovidPlanCheckout, type KvartovidPaidPlanId } from "@/lib/kvartovid/pricing";
import { amountToMinorUnits } from "@/lib/server/payments";
import { createYooKassaPayment } from "@/lib/server/yookassa";

export const runtime = "nodejs";

type CreatePaymentBody = {
  customerEmail?: string;
  planId?: KvartovidPaidPlanId;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  const planId = body.planId;

  if (!planId || !["listing", "cover", "realtor"].includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const checkout = getKvartovidPlanCheckout(planId);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fallbackEmail = body.customerEmail?.trim().toLowerCase() ?? "";
  const customerEmail = isPlaceholderOAuthEmail(user.email) ? fallbackEmail : user.email;

  if (!isValidEmail(customerEmail) || isPlaceholderOAuthEmail(customerEmail)) {
    return NextResponse.json(
      {
        code: "EMAIL_REQUIRED",
        error: "Для оплаты нужен email покупателя, чтобы сформировать чек."
      },
      { status: 400 }
    );
  }

  const idempotenceKey = crypto.randomUUID();
  const siteUrl = getSiteUrl(request);

  try {
    const payment = await createYooKassaPayment({
      amount: checkout.amountRub,
      customerEmail,
      credits: checkout.credits,
      description: checkout.description,
      idempotenceKey,
      returnUrl: `${siteUrl}/kvartovid/cabinet?payment=return`,
      userId,
      metadata: {
        product: "kvartovid",
        planId
      }
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;

    if (!confirmationUrl) {
      return NextResponse.json({ error: "Payment confirmation URL is missing" }, { status: 502 });
    }

    await db.insert(payments).values({
      id: payment.id,
      userId,
      provider: "yookassa",
      status: payment.status,
      amount: amountToMinorUnits(payment.amount.value),
      currency: payment.amount.currency,
      credits: checkout.credits,
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
    console.error("[kvartovid/payments]", error);
    const message = error instanceof Error ? error.message : "Payment creation failed";
    const status = message === "YOOKASSA_CREDENTIALS_MISSING" ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
