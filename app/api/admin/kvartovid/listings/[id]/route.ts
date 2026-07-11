import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/admin";
import { db } from "@/lib/db";
import { kvartovidListings, users } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [row] = await db
    .select({
      id: kvartovidListings.id,
      userId: kvartovidListings.userId,
      payload: kvartovidListings.payload,
      createdAt: kvartovidListings.createdAt,
      updatedAt: kvartovidListings.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(kvartovidListings)
    .leftJoin(users, eq(kvartovidListings.userId, users.id))
    .where(eq(kvartovidListings.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [userListingsCount] = await db
    .select({ value: count() })
    .from(kvartovidListings)
    .where(eq(kvartovidListings.userId, row.userId));

  return NextResponse.json({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    userListingsCount: userListingsCount?.value ?? 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    payload: row.payload
  });
}
