import { NextResponse } from "next/server";
import { getLatestDemoGenerationForGuest } from "@/lib/server/demo-generations";

export const runtime = "nodejs";

function sanitizeGuestId(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 64) return "";
  return trimmed;
}

/** Recover the last guest demo after client timeout / lost navigation. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guestId = sanitizeGuestId(
    request.headers.get("x-marketcard-guest-id") || searchParams.get("guestId")
  );

  if (!guestId) {
    return NextResponse.json({ error: "Missing guest_id" }, { status: 400 });
  }

  const maxAgeParam = searchParams.get("maxAgeMs");
  const maxAgeMs = maxAgeParam ? Number.parseInt(maxAgeParam, 10) : undefined;
  const existing = await getLatestDemoGenerationForGuest(
    guestId,
    Number.isFinite(maxAgeMs) && maxAgeMs! > 0 ? { maxAgeMs } : undefined
  );

  if (!existing) {
    return NextResponse.json({ error: "Демо не найдено." }, { status: 404 });
  }

  return NextResponse.json({
    id: existing.id,
    status: existing.status,
    previewUrl: `/api/generations/${existing.id}/preview`,
    createdAt: existing.createdAt
  });
}
