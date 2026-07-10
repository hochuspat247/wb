import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listKvartovidListings } from "@/lib/server/kvartovidListings";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const listings = await listKvartovidListings(userId);

  return NextResponse.json({ listings });
}
