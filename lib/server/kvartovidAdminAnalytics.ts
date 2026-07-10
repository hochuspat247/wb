import { and, count, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, kvartovidListings, users, videoGenerationOrders } from "@/lib/db/schema";
import type { Funnel7dStep } from "@/lib/server/funnel7d";
import { BRAND } from "@/lib/branding";

function buildStepPercents(steps: Array<{ id: string; label: string; count: number }>): Funnel7dStep[] {
  const startCount = steps[0]?.count ?? 0;

  return steps.map((step, index) => {
    const previousCount = index > 0 ? steps[index - 1]?.count ?? 0 : 0;

    return {
      ...step,
      fromPreviousPercent:
        index === 0 ? null : previousCount > 0 ? Math.round((step.count / previousCount) * 100) : 0,
      fromStartPercent: startCount > 0 ? Math.round((step.count / startCount) * 100) : index === 0 ? 100 : 0
    };
  });
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

type ListingCountRow = {
  userId: string;
  listingsCount: number;
};

async function getListingCountsByUser(): Promise<ListingCountRow[]> {
  const rows = await db
    .select({
      userId: kvartovidListings.userId,
      listingsCount: count()
    })
    .from(kvartovidListings)
    .groupBy(kvartovidListings.userId);

  return rows.map((row) => ({
    userId: row.userId,
    listingsCount: Number(row.listingsCount ?? 0)
  }));
}

async function getUsersInListingSegment(segment: "one" | "multiple", limit = 15) {
  const counts = await getListingCountsByUser();
  const filtered = counts
    .filter((row) => (segment === "one" ? row.listingsCount === 1 : row.listingsCount > 1))
    .sort((left, right) => right.listingsCount - left.listingsCount)
    .slice(0, limit);

  if (filtered.length === 0) {
    return [];
  }

  const userRows = await db.query.users.findMany({
    where: inArray(
      users.id,
      filtered.map((row) => row.userId)
    ),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
      generationsUsed: true,
      generationCredits: true,
      createdAt: true
    }
  });

  const userMap = new Map(userRows.map((user) => [user.id, user]));

  const latestListings = await db
    .select({
      userId: kvartovidListings.userId,
      payload: kvartovidListings.payload,
      updatedAt: kvartovidListings.updatedAt
    })
    .from(kvartovidListings)
    .where(inArray(kvartovidListings.userId, filtered.map((row) => row.userId)))
    .orderBy(desc(kvartovidListings.updatedAt));

  const latestByUser = new Map<string, { title: string; updatedAt: Date }>();
  for (const row of latestListings) {
    if (!latestByUser.has(row.userId)) {
      latestByUser.set(row.userId, {
        title: row.payload.title,
        updatedAt: row.updatedAt
      });
    }
  }

  return filtered
    .map((row) => {
      const user = userMap.get(row.userId);
      if (!user) return null;

      const latest = latestByUser.get(row.userId);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        hasPasswordAccount: Boolean(user.passwordHash),
        generationsUsed: user.generationsUsed,
        generationCredits: user.generationCredits,
        createdAt: user.createdAt,
        listingsCount: row.listingsCount,
        latestListingTitle: latest?.title ?? "—",
        lastProjectActivityAt: latest?.updatedAt
      };
    })
    .filter((user): user is NonNullable<typeof user> => user != null);
}

async function countKvartovidPathViews(path: string, since: Date) {
  const [row] = await db
    .select({ value: sql<number>`count(distinct ${analyticsEvents.sessionId})` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.createdAt, since),
        like(analyticsEvents.path, `${path}%`)
      )
    );

  return Number(row?.value ?? 0);
}

export async function getKvartovidAdminData() {
  const since7d = daysAgo(7);

  const [listingCount] = await db.select({ value: count() }).from(kvartovidListings);
  const listingCounts = await getListingCountsByUser();
  const usersWithOneListing = listingCounts.filter((row) => row.listingsCount === 1).length;
  const usersWithMultipleListings = listingCounts.filter((row) => row.listingsCount > 1).length;

  const allListings = await db.select({ payload: kvartovidListings.payload }).from(kvartovidListings);
  const withCover = allListings.filter((row) => row.payload.coverImageBase64 || row.payload.coverImageUrl).length;
  const withFloorPlan = allListings.filter((row) => row.payload.floorPlanSvg).length;

  const [listings7d] = await db
    .select({ value: count() })
    .from(kvartovidListings)
    .where(gte(kvartovidListings.createdAt, since7d));

  const [kvartovidVideos] = await db
    .select({ value: count() })
    .from(videoGenerationOrders)
    .where(and(like(videoGenerationOrders.sourceGenerationId, "kvartovid:%"), eq(videoGenerationOrders.status, "done")));

  const recentListingRows = await db
    .select({
      id: kvartovidListings.id,
      userId: kvartovidListings.userId,
      payload: kvartovidListings.payload,
      createdAt: kvartovidListings.createdAt,
      updatedAt: kvartovidListings.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(kvartovidListings)
    .leftJoin(users, eq(kvartovidListings.userId, users.id))
    .orderBy(desc(kvartovidListings.updatedAt))
    .limit(20);

  const userListingCounts = new Map(listingCounts.map((row) => [row.userId, row.listingsCount]));

  const funnel7d = buildStepPercents([
    { id: "landing", label: "Лендинг /kvartovid", count: await countKvartovidPathViews("/kvartovid", since7d) },
    { id: "create", label: "Создание объявления", count: await countKvartovidPathViews("/kvartovid/create", since7d) },
    { id: "cabinet", label: `Кабинет ${BRAND.kvartovid}`, count: await countKvartovidPathViews("/kvartovid/cabinet", since7d) },
    { id: "listings", label: "Объявления созданы (7д)", count: listings7d?.value ?? 0 },
    { id: "videos", label: "Видео готовы", count: kvartovidVideos?.value ?? 0 }
  ]);

  const [usersOneListing, usersMultipleListings] = await Promise.all([
    getUsersInListingSegment("one"),
    getUsersInListingSegment("multiple")
  ]);

  return {
    overview: {
      listings: listingCount?.value ?? 0,
      users: listingCounts.length,
      usersWithOneListing,
      usersWithMultipleListings,
      listingsWithCover: withCover,
      listingsWithFloorPlan: withFloorPlan,
      kvartovidVideos: kvartovidVideos?.value ?? 0,
      listings7d: listings7d?.value ?? 0
    },
    funnel7d,
    userSegments: {
      oneListing: usersOneListing,
      multipleListings: usersMultipleListings
    },
    recentListings: recentListingRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      userListingsCount: userListingCounts.get(row.userId) ?? 1,
      title: row.payload.title,
      city: row.payload.city,
      rooms: row.payload.rooms,
      area: row.payload.area,
      dealType: row.payload.dealType,
      propertyType: row.payload.propertyType,
      hasCover: Boolean(row.payload.coverImageBase64 || row.payload.coverImageUrl),
      hasFloorPlan: Boolean(row.payload.floorPlanSvg),
      qualityScore: row.payload.qualityScore,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))
  };
}
