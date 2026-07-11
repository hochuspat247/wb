import { and, desc, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accounts,
  demoGenerations,
  demoStories,
  kvartovidListings,
  payments,
  productCards,
  storyProjects,
  users
} from "@/lib/db/schema";
import { isAdminProductId, type AdminProductId } from "@/lib/admin/products";
import { formatUserAuthMethods } from "@/lib/admin/auth-methods";
import {
  inferRegistrationSource,
  planTierLabel,
  registrationProductLabel,
  registrationProductOriginLabel,
  registrationSourceLabel,
  resolveRegistrationProduct,
  type RegistrationProduct,
  type RegistrationSource,
  type UserPlanTier
} from "@/lib/auth/registrationMeta";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  authMethods: string;
  registrationSource: RegistrationSource | "unknown";
  registrationProduct: RegistrationProduct;
  registrationProductOrigin: "saved" | "callback" | "inferred";
  registrationReferrer: string | null;
  registrationCallbackUrl: string | null;
  registeredFromDemo: boolean;
  planTier: UserPlanTier;
  generationsUsed: number;
  generationCredits: number;
  hasPurchasedGenerationCredits: boolean;
  storyPremiumUnlocked: boolean;
  paymentsCount: number;
  totalPaidRub: number;
  projectStoriesCount: number;
  projectListingsCount: number;
  projectCardsCount: number;
  projectDemosCount: number;
  createdAt: string;
  lastActivityAt: string | null;
};

export type AdminUsersFilter = {
  product?: AdminProductId;
  source?: RegistrationSource;
  tier?: UserPlanTier;
  fromDemo?: boolean;
  q?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
};

function toTimestampMs(value: Date | number | string | null | undefined) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function toIsoString(value: Date | number | string | null | undefined) {
  const time = toTimestampMs(value);
  return new Date(time ?? 0).toISOString();
}

const IN_ARRAY_BATCH_SIZE = 400;

function chunkValues<T>(values: T[], size = IN_ARRAY_BATCH_SIZE) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function queryInBatches<T>(userIds: string[], query: (batchIds: string[]) => Promise<T[]>) {
  if (!userIds.length) {
    return [] as T[];
  }

  const batches = await Promise.all(chunkValues(userIds).map((batchIds) => query(batchIds)));
  return batches.flat();
}

async function loadStoryDemoCounts(userIds: string[]) {
  try {
    return await queryInBatches(userIds, (batchIds) =>
      db
        .select({
          userId: demoStories.userId,
          count: sql<number>`count(*)`
        })
        .from(demoStories)
        .where(and(inArray(demoStories.userId, batchIds), isNotNull(demoStories.userId)))
        .groupBy(demoStories.userId)
    );
  } catch (error) {
    console.warn("[Admin] demo_story counts unavailable", error);
    return [];
  }
}

function resolvePlanTier(user: {
  name?: string | null;
  email: string;
  hasPurchasedGenerationCredits: boolean;
  storyPremiumUnlocked: boolean;
}): UserPlanTier {
  if (hasUnlimitedGenerations(user)) {
    return "unlimited";
  }

  if (user.storyPremiumUnlocked) {
    return "premium";
  }

  if (user.hasPurchasedGenerationCredits) {
    return "pro";
  }

  return "free";
}

export type AdminUsersByProduct = Record<RegistrationProduct, number>;

function countByProduct(items: AdminUserListItem[]): AdminUsersByProduct {
  return {
    marketcard: items.filter((user) => user.registrationProduct === "marketcard").length,
    storystudio: items.filter((user) => user.registrationProduct === "storystudio").length,
    kvartovid: items.filter((user) => user.registrationProduct === "kvartovid").length,
    unknown: items.filter((user) => user.registrationProduct === "unknown").length
  };
}

export async function listAdminUsers(filter: AdminUsersFilter = {}) {
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  const offset = Math.max(filter.offset ?? 0, 0);

  const userRows = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
      generationsUsed: true,
      generationCredits: true,
      hasPurchasedGenerationCredits: true,
      storyPremiumUnlocked: true,
      registrationSource: true,
      registrationProduct: true,
      registrationReferrer: true,
      registrationCallbackUrl: true,
      registeredFromDemo: true,
      createdAt: true
    }
  });

  if (!userRows.length) {
    return {
      users: [],
      total: 0,
      byProduct: { marketcard: 0, storystudio: 0, kvartovid: 0, unknown: 0 }
    };
  }

  const userIds = userRows.map((user) => user.id);

  const [accountRows, paymentRows, storyCounts, listingCounts, cardCounts, demoCounts, storyDemoCounts] =
    await Promise.all([
      queryInBatches(userIds, (batchIds) =>
        db.query.accounts.findMany({
          where: inArray(accounts.userId, batchIds),
          columns: { userId: true, provider: true }
        })
      ),
      queryInBatches(userIds, (batchIds) =>
        db
          .select({
            userId: payments.userId,
            paymentsCount: sql<number>`count(*)`,
            totalPaidRub: sql<number>`coalesce(sum(CASE WHEN ${payments.paid} = 1 THEN ${payments.amount} ELSE 0 END), 0)`
          })
          .from(payments)
          .where(inArray(payments.userId, batchIds))
          .groupBy(payments.userId)
      ),
      queryInBatches(userIds, (batchIds) =>
        db
          .select({
            userId: storyProjects.userId,
            count: sql<number>`count(*)`,
            lastAt: sql<number>`max(${storyProjects.updatedAt})`
          })
          .from(storyProjects)
          .where(inArray(storyProjects.userId, batchIds))
          .groupBy(storyProjects.userId)
      ),
      queryInBatches(userIds, (batchIds) =>
        db
          .select({
            userId: kvartovidListings.userId,
            count: sql<number>`count(*)`,
            lastAt: sql<number>`max(${kvartovidListings.updatedAt})`
          })
          .from(kvartovidListings)
          .where(inArray(kvartovidListings.userId, batchIds))
          .groupBy(kvartovidListings.userId)
      ),
      queryInBatches(userIds, (batchIds) =>
        db
          .select({
            userId: productCards.userId,
            count: sql<number>`count(*)`,
            lastAt: sql<number>`max(${productCards.createdAt})`
          })
          .from(productCards)
          .where(inArray(productCards.userId, batchIds))
          .groupBy(productCards.userId)
      ),
      queryInBatches(userIds, (batchIds) =>
        db
          .select({
            userId: demoGenerations.userId,
            count: sql<number>`count(*)`,
            lastAt: sql<number>`max(${demoGenerations.createdAt})`
          })
          .from(demoGenerations)
          .where(and(inArray(demoGenerations.userId, batchIds), isNotNull(demoGenerations.userId)))
          .groupBy(demoGenerations.userId)
      ),
      loadStoryDemoCounts(userIds)
    ]);

  const providersByUser = new Map<string, string[]>();
  for (const row of accountRows) {
    const current = providersByUser.get(row.userId) ?? [];
    if (!current.includes(row.provider)) {
      current.push(row.provider);
    }
    providersByUser.set(row.userId, current);
  }

  const paymentsByUser = new Map(paymentRows.map((row) => [row.userId, row]));
  const storiesByUser = new Map(storyCounts.map((row) => [row.userId, row]));
  const listingsByUser = new Map(listingCounts.map((row) => [row.userId, row]));
  const cardsByUser = new Map(cardCounts.map((row) => [row.userId, row]));
  const demosByUser = new Map(demoCounts.map((row) => [row.userId!, row]));
  const storyDemosByUser = new Map(storyDemoCounts.map((row) => [row.userId!, row]));

  let items: AdminUserListItem[] = userRows.map((user) => {
    const providers = providersByUser.get(user.id) ?? [];
    const story = storiesByUser.get(user.id);
    const listing = listingsByUser.get(user.id);
    const card = cardsByUser.get(user.id);
    const demo = demosByUser.get(user.id);
    const storyDemo = storyDemosByUser.get(user.id);
    const payment = paymentsByUser.get(user.id);

    const projectStoriesCount = Number(story?.count ?? 0);
    const projectListingsCount = Number(listing?.count ?? 0);
    const projectCardsCount = Number(card?.count ?? 0);
    const marketcardDemoCount = Number(demo?.count ?? 0);
    const storyDemoCount = Number(storyDemo?.count ?? 0);
    const projectDemosCount = marketcardDemoCount + storyDemoCount;

    const { product: registrationProduct, origin: registrationProductOrigin } = resolveRegistrationProduct({
      stored: user.registrationProduct,
      callbackUrl: user.registrationCallbackUrl,
      referrer: user.registrationReferrer,
      hints: {
        hasStory: projectStoriesCount > 0,
        hasKvartovid: projectListingsCount > 0,
        hasMarketcard: projectCardsCount > 0 || marketcardDemoCount > 0,
        hasStoryDemo: storyDemoCount > 0,
        hasMarketcardDemo: marketcardDemoCount > 0
      }
    });

    const registrationSource = inferRegistrationSource({
      passwordHash: user.passwordHash,
      providers,
      storedSource: user.registrationSource
    });

    const registeredFromDemo =
      user.registeredFromDemo || projectDemosCount > 0 || Boolean(user.registrationCallbackUrl?.includes("fromDemo"));

    const lastActivityCandidates = [story?.lastAt, listing?.lastAt, card?.lastAt, demo?.lastAt]
      .map((value) => toTimestampMs(value))
      .filter((value): value is number => value !== null);
    const lastActivityAt = lastActivityCandidates.length
      ? new Date(Math.max(...lastActivityCandidates)).toISOString()
      : null;

    const planTier = resolvePlanTier(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      authMethods: formatUserAuthMethods({ passwordHash: user.passwordHash, providers }),
      registrationSource,
      registrationProduct,
      registrationProductOrigin,
      registrationReferrer: user.registrationReferrer ?? null,
      registrationCallbackUrl: user.registrationCallbackUrl ?? null,
      registeredFromDemo,
      planTier,
      generationsUsed: user.generationsUsed,
      generationCredits: user.generationCredits,
      hasPurchasedGenerationCredits: user.hasPurchasedGenerationCredits,
      storyPremiumUnlocked: user.storyPremiumUnlocked,
      paymentsCount: Number(payment?.paymentsCount ?? 0),
      totalPaidRub: Math.round(Number(payment?.totalPaidRub ?? 0) / 100),
      projectStoriesCount,
      projectListingsCount,
      projectCardsCount,
      projectDemosCount,
      createdAt: toIsoString(user.createdAt),
      lastActivityAt
    };
  });

  const byProductAll = countByProduct(items);

  if (filter.q?.trim()) {
    const query = filter.q.trim().toLowerCase();
    items = items.filter(
      (user) => user.email.toLowerCase().includes(query) || (user.name?.toLowerCase().includes(query) ?? false)
    );
  }

  if (filter.product && isAdminProductId(filter.product)) {
    items = items.filter((user) => user.registrationProduct === filter.product);
  }

  if (filter.source) {
    items = items.filter((user) => user.registrationSource === filter.source);
  }

  if (filter.tier) {
    items = items.filter((user) => user.planTier === filter.tier);
  }

  if (filter.fromDemo === true) {
    items = items.filter((user) => user.registeredFromDemo);
  }

  if (filter.fromDemo === false) {
    items = items.filter((user) => !user.registeredFromDemo);
  }

  if (filter.dateFrom) {
    const fromMs = filter.dateFrom.getTime();
    items = items.filter((user) => new Date(user.createdAt).getTime() >= fromMs);
  }

  if (filter.dateTo) {
    const toMs = filter.dateTo.getTime();
    items = items.filter((user) => new Date(user.createdAt).getTime() <= toMs);
  }

  const total = items.length;
  const usersPage = items.slice(offset, offset + limit);

  return { users: usersPage, total, byProduct: byProductAll };
}

export { planTierLabel, registrationProductLabel, registrationProductOriginLabel, registrationSourceLabel };
