import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { appUrl, sendEmail } from "@/lib/email";
import { FREE_TRIAL_CARDS } from "@/lib/pricing";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = body.name?.trim() || "Продавец";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Укажите корректный email." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не короче 8 символов." }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      return NextResponse.json({ error: "Аккаунт с таким email уже существует." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomUUID();

    await db.insert(users).values({
      email,
      name,
      passwordHash,
      generationCredits: FREE_TRIAL_CARDS,
      generationsUsed: 0,
      createdAt: new Date()
    });

    await db.insert(verificationTokens).values({
      identifier: `verify:${email}`,
      token: verifyToken,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
    });

    const verifyUrl = appUrl(`/api/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`);

    await sendEmail({
      to: email,
      subject: "Подтвердите email в MarketCard AI",
      html: `<p>Здравствуйте, ${name}!</p><p>Подтвердите email, чтобы сохранять карточки и получать доступ к генерациям:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
