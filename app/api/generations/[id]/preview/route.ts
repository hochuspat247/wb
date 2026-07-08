import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReadPreview, getDemoGeneration, getDemoPreviewBuffer } from "@/lib/server/demo-generations";

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

  const preview = await getDemoPreviewBuffer(row, userId);

  return new Response(preview.buffer, {
    headers: {
      "Content-Type": preview.mimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="marketcard-demo-${row.id}.png"`
    }
  });
}
