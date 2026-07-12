import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWildberriesAccessError, hasWildberriesAccess } from "@/lib/server/wildberriesAccess";
import { listWildberriesCards, publishWildberriesCard } from "@/lib/server/wildberries";
import type { WildberriesPublishInput } from "@/types/wildberries";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasWildberriesAccess(userId))) {
    return NextResponse.json({ error: getWildberriesAccessError(), code: "WB_LOCKED" }, { status: 402 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const limit = Number(searchParams.get("limit") || "20");
  const updatedAt = searchParams.get("updatedAt") || undefined;
  const nmId = searchParams.get("nmId") ? Number(searchParams.get("nmId")) : undefined;
  const source = searchParams.get("source") === "trash" ? "trash" : "active";

  try {
    const result = await listWildberriesCards(userId, {
      search,
      limit: Number.isFinite(limit) ? limit : 20,
      updatedAt,
      nmId,
      source
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить карточки WB." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasWildberriesAccess(userId))) {
    return NextResponse.json({ error: getWildberriesAccessError(), code: "WB_LOCKED" }, { status: 402 });
  }

  try {
    const body = (await request.json()) as WildberriesPublishInput;

    if (!body.card) {
      return NextResponse.json({ error: "Карточка не передана." }, { status: 400 });
    }

    const result = await publishWildberriesCard(userId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать карточку в WB." },
      { status: 400 }
    );
  }
}
