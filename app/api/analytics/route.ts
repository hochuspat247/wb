import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackAnalyticsEvent, type AnalyticsTrackInput } from "@/lib/server/analytics";
import {
  botProtectionErrorResponse,
  enforceIpRateLimit,
  isObviousAutomatedClient,
  recordIpRateLimitAttempt
} from "@/lib/server/botProtection";

export const runtime = "nodejs";

type TrackBody = {
  events: AnalyticsTrackInput[];
};

const ONE_MINUTE_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    if (isObviousAutomatedClient(request)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const analyticsLimit = await enforceIpRateLimit(
      "analytics",
      request,
      ONE_MINUTE_MS,
      Number.parseInt(process.env.ANALYTICS_IP_MINUTE_LIMIT || "120", 10) || 120
    );

    if (!analyticsLimit.allowed) {
      return botProtectionErrorResponse(analyticsLimit);
    }

    const session = await auth();
    const body = (await request.json()) as TrackBody;

    if (!Array.isArray(body.events) || !body.events.length) {
      return NextResponse.json({ error: "No events" }, { status: 400 });
    }

    const events = body.events.slice(0, 20);

    for (const event of events) {
      if (!event.sessionId || !event.eventName || !event.path || !event.eventType) {
        continue;
      }

      await trackAnalyticsEvent({
        ...event,
        userId: session?.user?.id ?? event.userId
      });
    }

    await recordIpRateLimitAttempt("analytics", request);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
