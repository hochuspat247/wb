import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { generateGeminiProductImage } from "@/lib/ai/geminiImage";
import { generateNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import { buildCharacterPortraitPrompt } from "@/lib/storystudio/prompt";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
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

    const quota = await getUserQuota(userId);
    if (!quota.canGenerate) {
      return NextResponse.json(
        { error: "Генерации закончились.", code: "QUOTA_EXCEEDED", quota },
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
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    let imageUrl: string | null = null;

    if (isNanoBananaExpertConfigured()) {
      const result = await generateNanoBananaExpertImage({
        productDescription: prompt,
        category: "character portrait",
        marketplace: "StoryStudio",
        style: "cinematic illustration",
        aspectRatio: "3:4",
        resolution: "1k",
        outputFormat: "png",
        model: "nb2",
        designPreset: "premium-marketplace",
        price: "",
        ctaText: "",
        title: character.name,
        benefits: [],
        characteristics: [],
        keywords: character.tags,
        infographicTexts: []
      });
      imageBase64 = result.imageBase64 ?? null;
      imageMimeType = result.mimeType ?? null;
      imageUrl = result.imageUrl ?? null;
    } else if (process.env.GEMINI_API_KEY) {
      const result = await generateGeminiProductImage({
        productDescription: prompt,
        category: "character portrait",
        marketplace: "StoryStudio",
        style: "cinematic illustration",
        aspectRatio: "3:4",
        resolution: "1k",
        outputFormat: "png",
        model: "nb2",
        designPreset: "premium-marketplace",
        price: "",
        ctaText: "",
        title: character.name,
        benefits: [],
        characteristics: [],
        keywords: character.tags,
        infographicTexts: []
      });
      imageBase64 = result.imageBase64 ?? null;
      imageMimeType = result.mimeType ?? null;
      imageUrl = result.imageUrl ?? null;
    } else {
      return NextResponse.json({ error: "Генерация изображений не настроена." }, { status: 503 });
    }

    const story = {
      ...row.payload,
      characters: row.payload.characters.map((c) =>
        c.id === body.characterId
          ? { ...c, imageBase64, imageMimeType, imageUrl }
          : c
      ),
      updatedAt: new Date().toISOString()
    };

    const now = new Date();
    await db
      .update(storyProjects)
      .set({ payload: story, updatedAt: now })
      .where(eq(storyProjects.id, body.storyId));

    const updatedQuota = await consumeGeneration(userId);
    return NextResponse.json({ story, quota: updatedQuota });
  } catch (error) {
    console.error("[storystudio/characters/image]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать портрет." },
      { status: 500 }
    );
  }
}
