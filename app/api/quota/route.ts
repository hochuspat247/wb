import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backfillCleanDownloadGeneration, getUserDownloadAccess } from "@/lib/server/downloadAccess";
import { getUserQuota } from "@/lib/server/quota";
import { hasStoryPremiumUnlocked } from "@/lib/server/storyPremium";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await backfillCleanDownloadGeneration(userId);
  const [quota, access, storyPremiumUnlocked] = await Promise.all([
    getUserQuota(userId),
    getUserDownloadAccess(userId),
    hasStoryPremiumUnlocked(userId)
  ]);

  return NextResponse.json({
    ...quota,
    storyPremiumUnlocked,
    cleanDownloadGenerationId: access.freeCleanDownloadGenerationId,
    downloadsFullyUnlocked: access.downloadsFullyUnlocked
  });
}
