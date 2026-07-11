import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { createDemoStory } from "@/lib/server/demo-stories";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { hashDemoClientIp } from "@/lib/server/demoRateLimit";
import { checkGuestStoryDemoAllowed, recordGuestStoryDemoAttempt } from "@/lib/server/storyDemoRateLimit";
import { hasStoryPremiumUnlocked } from "@/lib/server/storyPremium";
import { generateStoryFoundationDemo } from "@/lib/storystudio/generate";
import type { CreateStoryInput } from "@/types/storystudio";

export const runtime = "nodejs";
export const maxDuration = 180;

function sanitizeGuestId(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 64) return "";
  return trimmed;
}

export async function POST(request: Request) {
  let guestId = "";

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const body = (await request.json()) as CreateStoryInput & { guestId?: string };
    guestId = sanitizeGuestId(body.guestId);

    if (!guestId) {
      return NextResponse.json({ error: "Missing guest_id" }, { status: 400 });
    }

    if (!body.title?.trim() || !body.premise?.trim()) {
      return NextResponse.json({ error: "Укажите название и основную идею." }, { status: 400 });
    }

    if (Boolean(body.premiumMode)) {
      if (!userId) {
        return NextResponse.json(
          {
            error: "Режим 18+ доступен только с пакетом «Автор» или выше. Зарегистрируйтесь и оформите премиум.",
            code: "PREMIUM_REQUIRED"
          },
          { status: 403 }
        );
      }

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

    const rateLimit = await checkGuestStoryDemoAllowed(request, guestId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error, code: rateLimit.code, retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    await recordGuestStoryDemoAttempt(request, guestId);

    const policy = scanTextForProhibitedContent(
      [body.title, body.premise, body.charactersHint].filter(Boolean).join("\n")
    );
    if (!policy.allowed) {
      return createContentPolicyBlockedResponse(policy);
    }

    const story = await generateStoryFoundationDemo({
      title: body.title.trim(),
      premise: body.premise.trim(),
      charactersHint: body.charactersHint?.trim(),
      genres: body.genres?.length ? body.genres : ["fantasy"],
      language: body.language || "ru",
      targetWordCount: body.targetWordCount || 16000,
      premiumMode: Boolean(body.premiumMode)
    });

    await createDemoStory({
      guestId,
      userId,
      clientIpHash: hashDemoClientIp(request),
      story
    });

    return NextResponse.json({ story, guestId });
  } catch (error) {
    console.error("[storystudio/demo]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать демо-историю." },
      { status: 500 }
    );
  }
}
