import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kvartovidListings } from "@/lib/db/schema";
import type { KvartovidListingInput, KvartovidListingResult, KvartovidSavedListing } from "@/types/kvartovid";

export function buildKvartovidSavedListing(
  input: KvartovidListingInput,
  result: KvartovidListingResult,
  id = crypto.randomUUID()
): KvartovidSavedListing {
  const now = new Date().toISOString();

  return {
    id,
    dealType: input.dealType,
    propertyType: input.propertyType,
    rooms: input.rooms,
    area: input.area,
    floor: input.floor,
    totalFloors: input.totalFloors,
    price: input.price,
    city: input.city,
    district: input.district,
    metro: input.metro,
    photoCount: input.photos.length,
    title: result.title,
    description: result.description,
    platformTexts: result.platformTexts,
    advantages: result.advantages,
    suggestedHighlights: result.suggestedHighlights,
    bestPhotoIndex: result.bestPhotoIndex,
    coverImageBase64: result.coverImageBase64,
    coverImageMimeType: result.coverImageMimeType,
    coverImageUrl: result.coverImageUrl,
    coverImageProvider: result.coverImageProvider,
    coverImageModel: result.coverImageModel,
    coverImageError: result.coverImageError,
    qualityScore: result.qualityScore,
    qualityTips: result.qualityTips,
    floorPlanSvg: result.floorPlanSvg,
    floorPlanLayout: result.floorPlanLayout,
    floorPlanError: result.floorPlanError,
    createdAt: now,
    updatedAt: now
  };
}

export async function saveKvartovidListing(userId: string, listing: KvartovidSavedListing) {
  const now = new Date();

  await db.insert(kvartovidListings).values({
    id: listing.id,
    userId,
    payload: listing,
    createdAt: now,
    updatedAt: now
  });

  return listing;
}

export async function listKvartovidListings(userId: string) {
  const rows = await db.query.kvartovidListings.findMany({
    where: eq(kvartovidListings.userId, userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)]
  });

  return rows.map((row) => row.payload);
}

export async function getKvartovidListing(userId: string, listingId: string) {
  const row = await db.query.kvartovidListings.findFirst({
    where: eq(kvartovidListings.id, listingId)
  });

  if (!row || row.userId !== userId) {
    return null;
  }

  return row.payload;
}

export async function updateKvartovidListingFloorPlan(
  userId: string,
  listingId: string,
  floorPlanSvg: string,
  floorPlanLayout: KvartovidSavedListing["floorPlanLayout"]
) {
  const row = await db.query.kvartovidListings.findFirst({
    where: eq(kvartovidListings.id, listingId)
  });

  if (!row || row.userId !== userId || !floorPlanLayout) {
    return null;
  }

  const updated: KvartovidSavedListing = {
    ...row.payload,
    floorPlanSvg,
    floorPlanLayout,
    updatedAt: new Date().toISOString()
  };

  await db
    .update(kvartovidListings)
    .set({
      payload: updated,
      updatedAt: new Date()
    })
    .where(eq(kvartovidListings.id, listingId));

  return updated;
}

export async function deleteKvartovidListing(userId: string, listingId: string) {
  const row = await db.query.kvartovidListings.findFirst({
    where: eq(kvartovidListings.id, listingId)
  });

  if (!row || row.userId !== userId) {
    return false;
  }

  await db.delete(kvartovidListings).where(eq(kvartovidListings.id, listingId));
  return true;
}
