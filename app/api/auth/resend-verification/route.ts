import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { normalizeEmail } from "@/lib/auth/email-format";
import { userNeedsEmailVerification } from "@/lib/auth/email-utils";
import { sendVerificationEmail } from "@/lib/auth/send-verification-email";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { botProtectionErrorResponse, enforceIpRateLimit, recordIpRateLimitAttempt } from "@/lib/server/botProtection";

type ResendBody = {
  email?: string;
};

const GENERIC_OK_MESSAGE = "Если аккаунт существует и email не подтверждён, мы отправили письмо повторно.";
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const resendLimit = await enforceIpRateLimit(
    "resend_verification",
    request,
    ONE_HOUR_MS,
    Number.parseInt(process.env.RESEND_VERIFICATION_IP_HOURLY_LIMIT || "5", 10) || 5
  );

  if (!resendLimit.allowed) {
    return botProtectionErrorResponse(resendLimit);
  }

  const session = await auth();
  const body = (await request.json().catch(() => ({}))) as ResendBody;

  let user =
    session?.user?.id
      ? await db.query.users.findFirst({
          where: eq(users.id, session.user.id)
        })
      : null;

  if (!user) {
    const email = normalizeEmail(body.email ?? "");
    if (!email) {
      return NextResponse.json({ error: "Укажите email." }, { status: 400 });
    }

    user =
      (await db.query.users.findFirst({
        where: eq(users.email, email)
      })) ?? null;

    if (!user) {
      return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
    }
  }

  if (!userNeedsEmailVerification(user)) {
    return NextResponse.json({ ok: true, message: "Email уже подтверждён." });
  }

  try {
    await sendVerificationEmail(user);
  } catch {
    return NextResponse.json({ error: "Не удалось отправить письмо. Попробуйте позже." }, { status: 502 });
  }

  await recordIpRateLimitAttempt("resend_verification", request);

  return NextResponse.json({ ok: true, message: GENERIC_OK_MESSAGE });
}
