import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { attachGuestStoriesToUser } from "@/lib/server/demo-stories";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { guestId?: string };
  const guestId = body.guestId?.trim();

  if (!guestId) {
    return NextResponse.json({ error: "Missing guest_id" }, { status: 400 });
  }

  const migrated = await attachGuestStoriesToUser(guestId, userId);

  return NextResponse.json({
    migrated: migrated.length,
    stories: migrated
  });
}
