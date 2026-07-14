import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { generateStoryFoundation } from "@/lib/storystudio/generate";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { consumeStoryGeneration, getStoryUserQuota } from "@/lib/server/storyQuota";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { hasStoryPremiumUnlocked } from "@/lib/server/storyPremium";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";
import type { CreateStoryInput } from "@/types/storystudio";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы создать историю." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    const quota = await getStoryUserQuota(userId);
    if (!quota.canGenerate) {
      return NextResponse.json(
        { error: "Генерации закончились. Купите пакет в кабинете.", code: "QUOTA_EXCEEDED", quota },
        { status: 402 }
      );
    }

    const body = (await request.json()) as CreateStoryInput;
    if (!body.title?.trim() || !body.premise?.trim()) {
      return NextResponse.json({ error: "Укажите название и основную идею." }, { status: 400 });
    }

    const policy = scanTextForProhibitedContent(
      [body.title, body.premise, body.charactersHint].filter(Boolean).join("\n"),
      { product: "storystudio", allowAdult: Boolean(body.premiumMode) }
    );
    if (!policy.allowed) {
      return createContentPolicyBlockedResponse(policy);
    }

    if (Boolean(body.premiumMode)) {
      const premiumUnlocked = await hasStoryPremiumUnlocked(userId);
      if (!premiumUnlocked) {
        return NextResponse.json(
          {
            error: "Режим 18+ доступен только с пакетом «Автор» (50 генераций) или выше.",
            code: "PREMIUM_REQUIRED"
          },
          { status: 403 }
        );
      }
    }

    const story = await generateStoryFoundation({
      title: body.title.trim(),
      premise: body.premise.trim(),
      charactersHint: body.charactersHint?.trim(),
      genres: body.genres?.length ? body.genres : ["fantasy"],
      language: body.language || "ru",
      targetWordCount: body.targetWordCount || 16000,
      premiumMode: Boolean(body.premiumMode)
    });

    const now = new Date();
    await db.insert(storyProjects).values({
      id: story.id,
      userId,
      payload: story,
      createdAt: now,
      updatedAt: now
    });

    const updatedQuota = (await consumeStoryGeneration(userId, "text")).quota;

    return NextResponse.json({ story, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать историю." },
      { status: 500 }
    );
  }
}
