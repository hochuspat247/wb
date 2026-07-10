import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteKvartovidListing, getKvartovidListing } from "@/lib/server/kvartovidListings";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { id } = await context.params;
  const listing = await getKvartovidListing(userId, id);

  if (!listing) {
    return NextResponse.json({ error: "Объявление не найдено." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteKvartovidListing(userId, id);

  if (!deleted) {
    return NextResponse.json({ error: "Объявление не найдено." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
