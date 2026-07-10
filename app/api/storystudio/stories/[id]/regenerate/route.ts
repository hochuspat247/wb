import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isStoryFoundationEmpty, regenerateStoryFoundation } from "@/lib/storystudio/generate";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 180;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    const { id } = await context.params;
    const row = await db.query.storyProjects.findFirst({
      where: and(eq(storyProjects.id, id), eq(storyProjects.userId, userId))
    });

    if (!row) {
      return NextResponse.json({ error: "История не найдена." }, { status: 404 });
    }

    const wasEmpty = isStoryFoundationEmpty(row.payload);
    if (!wasEmpty) {
      const quota = await getUserQuota(userId);
      if (!quota.canGenerate) {
        return NextResponse.json(
          { error: "Генерации закончились. Купите пакет в кабинете.", code: "QUOTA_EXCEEDED", quota },
          { status: 402 }
        );
      }
    }

    const story = await regenerateStoryFoundation(row.payload);
    const now = new Date();

    await db
      .update(storyProjects)
      .set({ payload: story, updatedAt: now })
      .where(eq(storyProjects.id, id));

    const updatedQuota = wasEmpty ? await getUserQuota(userId) : (await consumeGeneration(userId)).quota;

    return NextResponse.json({ story, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/stories/regenerate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось перегенерировать историю." },
      { status: 500 }
    );
  }
}
