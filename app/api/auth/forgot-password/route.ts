import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { getEmailFormatError, normalizeEmail } from "@/lib/auth/email-validation";
import { appUrl, sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/branding";
import { botProtectionErrorResponse, enforceIpRateLimit, recordIpRateLimitAttempt } from "@/lib/server/botProtection";

type ForgotPasswordBody = {
  email?: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const forgotLimit = await enforceIpRateLimit(
      "forgot_password",
      request,
      ONE_HOUR_MS,
      Number.parseInt(process.env.FORGOT_PASSWORD_IP_HOURLY_LIMIT || "5", 10) || 5
    );

    if (!forgotLimit.allowed) {
      return botProtectionErrorResponse(forgotLimit);
    }

    const body = (await request.json()) as ForgotPasswordBody;
    const email = normalizeEmail(body.email ?? "");
    const emailError = getEmailFormatError(email);

    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (user?.passwordHash) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 1000 * 60 * 60);

      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `reset:${email}`));
      await db.insert(verificationTokens).values({
        identifier: `reset:${email}`,
        token,
        expires
      });

      const resetUrl = appUrl(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);

      await sendEmail({
        to: email,
        subject: `Восстановление пароля ${BRAND.marketCard}`,
        html: `<p>Чтобы задать новый пароль, перейдите по ссылке:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ссылка действует 1 час.</p>`
      });
    }

    await recordIpRateLimitAttempt("forgot_password", request);

    return NextResponse.json({
      ok: true,
      message: "Если аккаунт существует, мы отправили письмо с инструкцией."
    });
  } catch {
    return NextResponse.json({ error: "Не удалось отправить письмо." }, { status: 500 });
  }
}
