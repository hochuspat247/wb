import { NextResponse } from "next/server";
import { clearAdminSessionCookie, setAdminSessionCookie, verifyAdminCredentials } from "@/lib/auth/admin-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { login?: string; password?: string };
    const login = body.login?.trim() ?? "";
    const password = body.password ?? "";

    if (!verifyAdminCredentials(login, password)) {
      return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
    }

    await setAdminSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось войти в админку." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
