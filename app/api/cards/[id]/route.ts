import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCards, removeUserCard } from "@/lib/server/cards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const cards = await removeUserCard(userId, id);
  return NextResponse.json({ cards });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const cards = await getUserCards(userId);
  const card = cards.find((item) => item.id === id);

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}
