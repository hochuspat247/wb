import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { calculateStoryPackagePrice } from "@/lib/storystudio/pricing";
import { amountToMinorUnits } from "@/lib/server/payments";
import { createYooKassaPayment } from "@/lib/server/yookassa";
import { BRAND } from "@/lib/branding";

export const runtime = "nodejs";

type CreatePaymentBody = {
  customerEmail?: string;
  count?: number;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
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

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fallbackEmail = body.customerEmail?.trim().toLowerCase() ?? "";
  const customerEmail = isPlaceholderOAuthEmail(user.email) ? fallbackEmail : user.email;

  if (!isValidEmail(customerEmail) || isPlaceholderOAuthEmail(customerEmail)) {
    return NextResponse.json(
      { code: "EMAIL_REQUIRED", error: "Для оплаты нужен email покупателя, чтобы сформировать чек." },
      { status: 400 }
    );
  }

  const price = calculateStoryPackagePrice(count);
  const idempotenceKey = crypto.randomUUID();
  const siteUrl = getSiteUrl(request);

  try {
    const payment = await createYooKassaPayment({
      amount: price.total,
      customerEmail,
      credits: count,
      description: `${BRAND.storyStudio}: ${count} генераций`,
      idempotenceKey,
      returnUrl: `${siteUrl}/storystudio/cabinet?payment=return`,
      userId,
      metadata: { product: "storystudio" }
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
      credits: count,
      product: "storystudio",
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
    console.error("[storystudio/payments]", error);
    return NextResponse.json({ error: "Не удалось создать платёж." }, { status: 500 });
  }
}
