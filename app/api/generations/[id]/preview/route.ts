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

  return new Response(Buffer.from(row.previewImageBase64, "base64"), {
    headers: {
      "Content-Type": row.previewImageMimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="marketcard-demo-${row.id}.png"`
    }
  });
}
