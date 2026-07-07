import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReadPreview, getDemoGeneration } from "@/lib/server/demo-generations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = request.headers.get("x-marketcard-guest-id") || new URL(request.url).searchParams.get("guestId");
  const row = await getDemoGeneration(id);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canReadPreview(row, { guestId, userId })) {
    return NextResponse.json({ error: userId ? "Forbidden" : "Unauthorized" }, { status: userId ? 403 : 401 });
  }

  const originalAvailable = Boolean(userId && row.userId === userId);

  return NextResponse.json({
    id: row.id,
    status: row.status,
    card: row.payload,
    previewUrl: `/api/generations/${row.id}/preview`,
    downloadOriginalUrl: originalAvailable ? `/api/generations/${row.id}/original` : undefined,
    originalAvailable
  });
}
