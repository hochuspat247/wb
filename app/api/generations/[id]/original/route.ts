import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReadOriginal, getDemoGeneration } from "@/lib/server/demo-generations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const row = await getDemoGeneration(id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canReadOriginal(row, userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const extension = row.originalImageMimeType.includes("jpeg")
    ? "jpg"
    : row.originalImageMimeType.includes("svg")
      ? "svg"
      : "png";

  return new Response(Buffer.from(row.originalImageBase64, "base64"), {
    headers: {
      "Content-Type": row.originalImageMimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="marketcard-original-${row.id}.${extension}"`
    }
  });
}
