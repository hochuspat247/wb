import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { upsertVisitorPresence } from "@/lib/server/presence";

export const runtime = "nodejs";

type PresenceBody = {
  sessionId?: string;
  path?: string;
  section?: string;
  lastAction?: string;
  lastActionLabel?: string;
  guestId?: string;
  isAuthed?: boolean;
  isVisible?: boolean;
  referrer?: string;
};

export async function POST(request: Request) {
  let body: PresenceBody;

  try {
    body = (await request.json()) as PresenceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sessionId || !body.path) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.path.startsWith("/admin")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let userId: string | undefined;

  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (error) {
    console.error("[MarketCard AI] presence auth lookup failed", error);
  }

  try {
    await upsertVisitorPresence({
      sessionId: body.sessionId,
      path: body.path,
      section: body.section,
      lastAction: body.lastAction,
      lastActionLabel: body.lastActionLabel,
      guestId: body.guestId,
      userId,
      referrer: body.referrer,
      isAuthed: Boolean(userId ?? body.isAuthed),
      isVisible: body.isVisible !== false
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MarketCard AI] presence update failed", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
