import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { generateStoryChapter } from "@/lib/storystudio/generate";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { consumeStoryGeneration, getStoryUserQuota } from "@/lib/server/storyQuota";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);
    if (!user) return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });

    const verificationError = getEmailVerificationError(user);
    if (verificationError) return NextResponse.json(verificationError, { status: 403 });

    const quota = await getStoryUserQuota(userId);
    if (!quota.canGenerate) {
      return NextResponse.json(
        { error: "Генерации закончились.", code: "QUOTA_EXCEEDED", quota },
        { status: 402 }
      );
    }

    const body = (await request.json()) as { storyId: string; instructions?: string };
    if (!body.storyId) {
      return NextResponse.json({ error: "Укажите storyId." }, { status: 400 });
    }

    const row = await db.query.storyProjects.findFirst({
      where: and(eq(storyProjects.id, body.storyId), eq(storyProjects.userId, userId))
    });
    if (!row) {
      return NextResponse.json({ error: "История не найдена." }, { status: 404 });
    }

    const policy = scanTextForProhibitedContent(body.instructions ?? "", {
      product: "storystudio",
      allowAdult: Boolean(row.payload.premiumMode)
    });
    if (!policy.allowed) return createContentPolicyBlockedResponse(policy);

    const chapterNumber = row.payload.chapters.length + 1;
    const chapter = await generateStoryChapter(row.payload, chapterNumber, body.instructions);

    const story = {
      ...row.payload,
      chapters: [...row.payload.chapters, chapter],
      updatedAt: new Date().toISOString()
    };

    const now = new Date();
    await db
      .update(storyProjects)
      .set({ payload: story, updatedAt: now })
      .where(eq(storyProjects.id, body.storyId));

    const updatedQuota = (await consumeStoryGeneration(userId, "text")).quota;
    return NextResponse.json({ story, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/chapters/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать главу." },
      { status: 500 }
    );
  }
}
