import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWildberriesAccessError, hasWildberriesAccess } from "@/lib/server/wildberriesAccess";
import { searchWildberriesSubjects } from "@/lib/server/wildberries";

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
  const query = searchParams.get("query") || "";

  try {
    const subjects = await searchWildberriesSubjects(userId, query);
    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось найти категории WB." },
      { status: 400 }
    );
  }
}
