import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { clearUserCards, getUserCards, saveUserCard, saveUserCardsBulk } from "@/lib/server/cards";
import type { ProductCardResult } from "@/types/product-card";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await getUserCards(userId);
  return NextResponse.json({ cards });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { card?: ProductCardResult; cards?: ProductCardResult[] };

    if (body.cards?.length) {
      const cards = await saveUserCardsBulk(userId, body.cards);
      return NextResponse.json({ cards });
    }

    if (!body.card) {
      return NextResponse.json({ error: "Card is required" }, { status: 400 });
    }

    const cards = await saveUserCard(userId, body.card);
    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "Failed to save card" }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearUserCards(userId);
  return NextResponse.json({ cards: [] });
}
