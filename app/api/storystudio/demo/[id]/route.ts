import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReadDemoStory, getDemoStory } from "@/lib/server/demo-stories";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId =
    request.headers.get("x-storystudio-guest-id")?.trim() ||
    new URL(request.url).searchParams.get("guestId")?.trim() ||
    "";

  const row = await getDemoStory(id);
  if (!row) {
    return NextResponse.json({ error: "Демо-история не найдена." }, { status: 404 });
  }

  if (!canReadDemoStory(row, { guestId, userId })) {
    return NextResponse.json({ error: userId ? "Forbidden" : "Unauthorized" }, { status: userId ? 403 : 401 });
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
    story: row.payload,
    isDemo: true
  });
}
