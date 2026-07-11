import { NextResponse } from "next/server";
import { isAdminProductId } from "@/lib/admin/products";
import type { RegistrationSource } from "@/lib/auth/registrationMeta";
import type { UserPlanTier } from "@/lib/auth/registrationMeta";
import { listAdminUsers } from "@/lib/server/adminUsers";
import { requireAdminSession } from "@/lib/server/admin";

export const runtime = "nodejs";

function parseDateParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productParam = searchParams.get("product");
  const sourceParam = searchParams.get("source");
  const tierParam = searchParams.get("tier");
  const fromDemoParam = searchParams.get("fromDemo");
  const q = searchParams.get("q")?.trim();
  const limit = Number.parseInt(searchParams.get("limit") || "100", 10);
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

  const source =
    sourceParam === "email" || sourceParam === "vk" || sourceParam === "yandex" ? sourceParam : undefined;
  const tier =
    tierParam === "free" || tierParam === "pro" || tierParam === "premium" || tierParam === "unlimited"
      ? (tierParam as UserPlanTier)
      : undefined;

  let fromDemo: boolean | undefined;
  if (fromDemoParam === "true") {
    fromDemo = true;
  } else if (fromDemoParam === "false") {
    fromDemo = false;
  }

  try {
    const result = await listAdminUsers({
      product: isAdminProductId(productParam) ? productParam : undefined,
      source: source as RegistrationSource | undefined,
      tier,
      fromDemo,
      q,
      dateFrom: parseDateParam(searchParams.get("dateFrom")),
      dateTo: parseDateParam(searchParams.get("dateTo")),
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin] users list failed", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
