import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getKvartovidGenerationQuota } from "@/lib/server/kvartovidQuota";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const quota = await getKvartovidGenerationQuota(userId);

  return NextResponse.json({ quota });
}
