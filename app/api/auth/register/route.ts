import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

    await db.insert(users).values({
      email,
      name,
      passwordHash,
      createdAt: new Date()
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
