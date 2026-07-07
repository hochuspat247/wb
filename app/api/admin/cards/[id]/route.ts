import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/admin";
import { db } from "@/lib/db";
import { productCards, users } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [card] = await db
    .select({
      id: productCards.id,
      userId: productCards.userId,
      payload: productCards.payload,
      createdAt: productCards.createdAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(productCards)
    .leftJoin(users, eq(productCards.userId, users.id))
    .where(eq(productCards.id, id))
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: card.id,
    userId: card.userId,
    userName: card.userName,
    userEmail: card.userEmail,
    createdAt: card.createdAt,
    payload: card.payload
  });
}
