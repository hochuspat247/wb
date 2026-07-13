import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import type { YooKassaPayment } from "@/lib/server/yookassa";
import { unlockAllDownloadsForUser } from "@/lib/server/downloadAccess";
import { STORY_PREMIUM_MIN_PACKAGE_CREDITS, unlockStoryPremium } from "@/lib/server/storyPremium";

export function amountToMinorUnits(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Math.round(numericValue * 100);
}

function resolvePaymentProduct(payment: YooKassaPayment, localProduct?: string | null) {
  return payment.metadata?.product || localProduct || "marketcard";
}

export async function applyVerifiedPayment(payment: YooKassaPayment) {
  const isSucceeded = payment.status === "succeeded" && payment.paid;
  const now = new Date();

  const localPayment = await db.query.payments.findFirst({
    where: eq(payments.id, payment.id),
    columns: { product: true }
  });

  const product = resolvePaymentProduct(payment, localPayment?.product);

  await db
    .update(payments)
    .set({
      status: payment.status,
      paid: payment.paid,
      updatedAt: now
    })
    .where(eq(payments.id, payment.id));

  if (!isSucceeded) {
    return { credited: false };
  }

  const creditedRows = await db
    .update(payments)
    .set({
      creditedAt: now,
      updatedAt: now
    })
    .where(and(eq(payments.id, payment.id), isNull(payments.creditedAt)))
    .returning({
      userId: payments.userId,
      credits: payments.credits
    });

  const creditedPayment = creditedRows[0];

  if (!creditedPayment) {
    return { credited: false };
  }

  if (product === "storystudio") {
    await db
      .update(users)
      .set({
        storyGenerationCredits: sql`${users.storyGenerationCredits} + ${creditedPayment.credits}`
      })
      .where(eq(users.id, creditedPayment.userId));

    if (creditedPayment.credits >= STORY_PREMIUM_MIN_PACKAGE_CREDITS) {
      await unlockStoryPremium(creditedPayment.userId);
    }
  } else {
    await db
      .update(users)
      .set({
        generationCredits: sql`${users.generationCredits} + ${creditedPayment.credits}`
      })
      .where(eq(users.id, creditedPayment.userId));
  }

  await unlockAllDownloadsForUser(creditedPayment.userId);

  return { credited: true, credits: creditedPayment.credits, product };
}
