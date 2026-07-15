import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { generatePromptOnlyImage } from "@/lib/ai/promptOnlyImage";
import { formatImageProviderError } from "@/lib/ai/imageGenerationErrors";
import { buildStoryMediaPrompt } from "@/lib/storystudio/prompt";
import { consumeStoryGeneration, getStoryUserQuota } from "@/lib/server/storyQuota";
import { downloadRemoteImageAsBase64 } from "@/lib/server/remoteImage";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { db } from "@/lib/db";
import { storyProjects } from "@/lib/db/schema";
import type { StoryMediaAsset, StoryMediaKind } from "@/types/storystudio";

export const runtime = "nodejs";
export const maxDuration = 300;

const VALID_KINDS: StoryMediaKind[] = ["character", "world", "chapter", "fact"];

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
        { error: "Генерации изображений закончились.", code: "QUOTA_EXCEEDED", quota },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      storyId?: string;
      kind?: StoryMediaKind;
      title?: string;
      prompt?: string;
      entityId?: string;
      showInReader?: boolean;
    };

    if (!body.storyId || !body.kind || !VALID_KINDS.includes(body.kind)) {
      return NextResponse.json({ error: "Укажите storyId и тип сущности." }, { status: 400 });
    }

    const title = String(body.title ?? "").trim();
    const prompt = String(body.prompt ?? "").trim();
    if (!title && !prompt) {
      return NextResponse.json({ error: "Опишите, что нужно сгенерировать." }, { status: 400 });
    }

    const row = await db.query.storyProjects.findFirst({
      where: and(eq(storyProjects.id, body.storyId), eq(storyProjects.userId, userId))
    });
    if (!row) {
      return NextResponse.json({ error: "История не найдена." }, { status: 404 });
    }

    const character =
      body.kind === "character" && body.entityId
        ? row.payload.characters.find((c) => c.id === body.entityId)
        : undefined;

    const mediaPrompt = buildStoryMediaPrompt({
      kind: body.kind,
      title: title || prompt.slice(0, 60),
      prompt: prompt || title,
      story: row.payload,
      character
    });

    const result = await generatePromptOnlyImage({
      prompt: mediaPrompt,
      aspectRatio: body.kind === "character" ? "3:4" : "16:9",
      resolution: "1k",
      outputFormat: "png",
      model: "nb2",
      skipContentPolicy: true,
      contentPolicyText: [title, prompt, row.payload.title, row.payload.world.setting]
        .filter(Boolean)
        .join(". ")
    });

    if (result.isFallback || (!result.imageBase64 && !result.imageUrl)) {
      return NextResponse.json(
        {
          error:
            formatImageProviderError(result.error) || "Не удалось сгенерировать изображение. Попробуйте ещё раз."
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

    const asset: StoryMediaAsset = {
      id: crypto.randomUUID(),
      kind: body.kind,
      title: title || prompt.slice(0, 60),
      prompt: prompt || title,
      entityId: body.entityId,
      imageBase64,
      imageMimeType,
      imageUrl: imageBase64 ? null : result.imageUrl ?? null,
      showInReader: Boolean(body.showInReader),
      createdAt: new Date().toISOString()
    };

    let story = {
      ...row.payload,
      media: [...(row.payload.media ?? []), asset],
      updatedAt: new Date().toISOString()
    };

    if (body.kind === "character" && character) {
      story = {
        ...story,
        characters: story.characters.map((c) =>
          c.id === character.id
            ? {
                ...c,
                imageBase64,
                imageMimeType,
                imageUrl: imageBase64 ? null : result.imageUrl ?? null
              }
            : c
        )
      };
    }

    if (body.kind === "chapter" && body.entityId && body.showInReader) {
      story = {
        ...story,
        chapters: story.chapters.map((chapter) =>
          chapter.id === body.entityId ? { ...chapter, mediaAssetId: asset.id } : chapter
        )
      };
    }

    const now = new Date();
    await db
      .update(storyProjects)
      .set({ payload: story, updatedAt: now })
      .where(eq(storyProjects.id, body.storyId));

    const updatedQuota = (await consumeStoryGeneration(userId, "portrait")).quota;
    return NextResponse.json({ story, asset, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/media]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать медиа." },
      { status: 500 }
    );
  }
}
