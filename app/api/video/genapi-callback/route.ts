import { NextResponse } from "next/server";
import { applyGenApiCallback } from "@/lib/server/videoOrders";
import { verifyGenApiCallbackSecret } from "@/lib/server/videoSourceImage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!verifyGenApiCallbackSecret(secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const externalTaskId = String(payload.request_id || payload.task_id || payload.id || "");

  if (!externalTaskId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await applyGenApiCallback(externalTaskId, payload);

  return NextResponse.json({ ok: true });
}
