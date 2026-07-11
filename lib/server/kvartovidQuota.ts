import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kvartovidListings } from "@/lib/db/schema";
import { KVARTOVID_FREE_LISTINGS } from "@/lib/kvartovid/pricing";
import { consumeGeneration, getUserQuota, refundGeneration, type UserQuota } from "@/lib/server/quota";

export type KvartovidGenerationQuota = UserQuota & {
  listingsCount: number;
  freeListingsLimit: number;
  freeListingsRemaining: number;
  usesGlobalQuota: boolean;
};

export async function countKvartovidListings(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(kvartovidListings)
    .where(eq(kvartovidListings.userId, userId));

  return Number(row?.value ?? 0);
}

export async function getKvartovidGenerationQuota(userId: string): Promise<KvartovidGenerationQuota> {
  const listingsCount = await countKvartovidListings(userId);
  const freeListingsRemaining = Math.max(0, KVARTOVID_FREE_LISTINGS - listingsCount);
  const globalQuota = await getUserQuota(userId);

  if (freeListingsRemaining > 0) {
    return {
      ...globalQuota,
      listingsCount,
      freeListingsLimit: KVARTOVID_FREE_LISTINGS,
      freeListingsRemaining,
      canGenerate: true,
      usesGlobalQuota: false,
      remaining: freeListingsRemaining + globalQuota.remaining
    };
  }

  return {
    ...globalQuota,
    listingsCount,
    freeListingsLimit: KVARTOVID_FREE_LISTINGS,
    freeListingsRemaining: 0,
    canGenerate: globalQuota.canGenerate,
    usesGlobalQuota: true
  };
}

export async function consumeKvartovidGeneration(userId: string) {
  const listingsCount = await countKvartovidListings(userId);

  if (listingsCount <= KVARTOVID_FREE_LISTINGS) {
    return {
      quota: await getKvartovidGenerationQuota(userId),
      consumedGlobal: false
    };
  }

  const result = await consumeGeneration(userId);

  return {
    quota: await getKvartovidGenerationQuota(userId),
    consumedGlobal: result.consumed
  };
}

export async function refundKvartovidGeneration(userId: string, consumedGlobal: boolean) {
  if (consumedGlobal) {
    await refundGeneration(userId);
  }

  return getKvartovidGenerationQuota(userId);
}
