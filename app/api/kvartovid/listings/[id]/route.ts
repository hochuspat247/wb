import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deleteKvartovidListing,
  getKvartovidListing,
  updateKvartovidListingFloorPlan
} from "@/lib/server/kvartovidListings";
import type { KvartovidFloorPlanLayout } from "@/types/kvartovid";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { id } = await context.params;
  const listing = await getKvartovidListing(userId, id);

  if (!listing) {
    return NextResponse.json({ error: "Объявление не найдено." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    floorPlanSvg?: string;
    floorPlanLayout?: KvartovidFloorPlanLayout;
  };

  if (!body.floorPlanSvg || !body.floorPlanLayout) {
    return NextResponse.json({ error: "Нужны floorPlanSvg и floorPlanLayout." }, { status: 400 });
  }

  const listing = await updateKvartovidListingFloorPlan(
    userId,
    id,
    body.floorPlanSvg,
    body.floorPlanLayout
  );

  if (!listing) {
    return NextResponse.json({ error: "Объявление не найдено." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteKvartovidListing(userId, id);

  if (!deleted) {
    return NextResponse.json({ error: "Объявление не найдено." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
