import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackAnalyticsEvent, type AnalyticsTrackInput } from "@/lib/server/analytics";

export const runtime = "nodejs";

type TrackBody = {
  events: AnalyticsTrackInput[];
};

export async function POST(request: Request) {
  try {
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
