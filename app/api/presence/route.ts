import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  botProtectionErrorResponse,
  enforceIpRateLimit,
  isObviousAutomatedClient,
  recordIpRateLimitAttempt
} from "@/lib/server/botProtection";
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

const ONE_MINUTE_MS = 60 * 1000;

export async function POST(request: Request) {
  if (isObviousAutomatedClient(request)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const presenceLimit = await enforceIpRateLimit(
    "presence",
    request,
    ONE_MINUTE_MS,
    Number.parseInt(process.env.PRESENCE_IP_MINUTE_LIMIT || "180", 10) || 180
  );

  if (!presenceLimit.allowed) {
    return botProtectionErrorResponse(presenceLimit);
  }

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

  let userId: string | null | undefined;
  let authResolved = false;

  try {
    const session = await auth();
    authResolved = true;
    userId = session?.user?.id ?? null;
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
      authResolved,
      referrer: body.referrer,
      isAuthed: authResolved ? Boolean(userId) : undefined,
      isVisible: body.isVisible !== false
    });

    await recordIpRateLimitAttempt("presence", request);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MarketCard AI] presence update failed", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
