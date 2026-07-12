import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWildberriesAccessError, hasWildberriesAccess } from "@/lib/server/wildberriesAccess";
import { getWildberriesCatalogCard, updateWildberriesCatalogCard } from "@/lib/server/wildberries";
import type { WildberriesUpdateInput } from "@/types/wildberries";

type RouteContext = {
  params: Promise<{ nmId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasWildberriesAccess(userId))) {
    return NextResponse.json({ error: getWildberriesAccessError(), code: "WB_LOCKED" }, { status: 402 });
  }

  const { nmId: nmIdParam } = await context.params;
  const nmId = Number(nmIdParam);

  if (!Number.isFinite(nmId) || nmId <= 0) {
    return NextResponse.json({ error: "Некорректный nmID." }, { status: 400 });
  }

  try {
    const card = await getWildberriesCatalogCard(userId, nmId);
    return NextResponse.json({ card });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить карточку WB." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasWildberriesAccess(userId))) {
    return NextResponse.json({ error: getWildberriesAccessError(), code: "WB_LOCKED" }, { status: 402 });
  }

  const { nmId: nmIdParam } = await context.params;
  const nmId = Number(nmIdParam);

  if (!Number.isFinite(nmId) || nmId <= 0) {
    return NextResponse.json({ error: "Некорректный nmID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Omit<WildberriesUpdateInput, "nmId">;
    const result = await updateWildberriesCatalogCard(userId, {
      ...body,
      nmId
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обновить карточку WB." },
      { status: 400 }
    );
  }
}
