import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { generatePromptOnlyImage } from "@/lib/ai/promptOnlyImage";
import { formatImageProviderError } from "@/lib/ai/imageGenerationErrors";
import { buildCharacterPortraitPrompt } from "@/lib/storystudio/prompt";
import { consumeStoryGeneration, getStoryUserQuota } from "@/lib/server/storyQuota";
import { downloadRemoteImageAsBase64 } from "@/lib/server/remoteImage";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    if (!quota.canGeneratePortrait) {
      return NextResponse.json(
        { error: "Генерации портретов закончились.", code: "QUOTA_EXCEEDED", quota },
        { status: 402 }
      );
    }

    const body = (await request.json()) as { storyId: string; characterId: string };
    if (!body.storyId || !body.characterId) {
      return NextResponse.json({ error: "Укажите storyId и characterId." }, { status: 400 });
    }

    const row = await db.query.storyProjects.findFirst({
      where: and(eq(storyProjects.id, body.storyId), eq(storyProjects.userId, userId))
    });
    if (!row) {
      return NextResponse.json({ error: "История не найдена." }, { status: 404 });
    }

    const character = row.payload.characters.find((c) => c.id === body.characterId);
    if (!character) {
      return NextResponse.json({ error: "Персонаж не найден." }, { status: 404 });
    }

    const prompt = buildCharacterPortraitPrompt(character, row.payload);
    const result = await generatePromptOnlyImage({
      prompt,
      aspectRatio: process.env.NANOBANANA_EXPERT_ASPECT_RATIO || "3:4",
      resolution: "1k",
      outputFormat: "png",
      model: "nb2",
      skipContentPolicy: true,
      contentPolicyText: [character.name, character.role, character.appearance, character.personality]
        .filter(Boolean)
        .join(". ")
    });

    if (result.isFallback || (!result.imageBase64 && !result.imageUrl)) {
      return NextResponse.json(
        {
          error: formatImageProviderError(result.error) || "Не удалось сгенерировать портрет. Попробуйте ещё раз."
        },
        { status: 502 }
      );
    }

    let imageBase64 = result.imageBase64 ?? null;
    let imageMimeType = result.mimeType ?? null;

    if (!imageBase64 && result.imageUrl) {
      const downloaded = await downloadRemoteImageAsBase64(result.imageUrl);
      if (downloaded) {
        imageBase64 = downloaded.base64;
        imageMimeType = downloaded.mimeType;
      }
    }

    const story = {
      ...row.payload,
      characters: row.payload.characters.map((c) =>
        c.id === body.characterId
          ? {
              ...c,
              imageBase64,
              imageMimeType,
              imageUrl: imageBase64 ? null : result.imageUrl ?? null
            }
          : c
      ),
      updatedAt: new Date().toISOString()
    };

    const now = new Date();
    await db
      .update(storyProjects)
      .set({ payload: story, updatedAt: now })
      .where(eq(storyProjects.id, body.storyId));

    const updatedQuota = (await consumeStoryGeneration(userId, "portrait")).quota;
    return NextResponse.json({ story, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/characters/image]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать портрет." },
      { status: 500 }
    );
  }
}
