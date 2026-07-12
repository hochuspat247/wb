import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getWildberriesIntegrationStatus,
  removeWildberriesIntegration,
  saveWildberriesIntegration
} from "@/lib/server/wildberries";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getWildberriesIntegrationStatus(userId));
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { token?: string; isSandbox?: boolean };
  const token = body.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Укажите WB API-токен." }, { status: 400 });
  }

  try {
    const status = await saveWildberriesIntegration(userId, token, Boolean(body.isSandbox));
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось подключить WB API." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await removeWildberriesIntegration(userId);
  return NextResponse.json({ connected: false, isSandbox: false });
}
