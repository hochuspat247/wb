import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, productCards, users } from "@/lib/db/schema";

export type AnalyticsTrackInput = {
  eventType: "page_view" | "click" | "conversion";
  eventName: string;
  path: string;
  referrer?: string;
  label?: string;
  xPercent?: number;
  yPercent?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, string | number | boolean>;
};

export async function trackAnalyticsEvent(input: AnalyticsTrackInput) {
  await db.insert(analyticsEvents).values({
    eventType: input.eventType,
    eventName: input.eventName,
    path: input.path.slice(0, 300),
    referrer: input.referrer?.slice(0, 500),
    label: input.label?.slice(0, 200),
    xPercent: input.xPercent,
    yPercent: input.yPercent,
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    userId: input.userId,
    sessionId: input.sessionId.slice(0, 80),
    metadata: input.metadata,
    createdAt: new Date()
  });
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function safeAnalyticsQuery<T>(label: string, query: Promise<T>, fallback: T) {
  try {
    return await query;
  } catch (error) {
    console.error(`[MarketCard AI] Admin analytics query failed: ${label}`, error);
    return fallback;
  }
}

export async function getAdminAnalytics(pathFilter = "/") {
  const since7d = daysAgo(7);
  const since30d = daysAgo(30);

  const [userCount] = await safeAnalyticsQuery("user count", db.select({ value: count() }).from(users), [{ value: 0 }]);
  const [cardCount] = await safeAnalyticsQuery("card count", db.select({ value: count() }).from(productCards), [{ value: 0 }]);
  const [generationsSum] = await safeAnalyticsQuery(
    "generations sum",
    db.select({ value: sql<number>`coalesce(sum(${users.generationsUsed}), 0)` }).from(users),
    [{ value: 0 }]
  );

  const [events7d] = await safeAnalyticsQuery(
    "events 7d",
    db.select({ value: count() }).from(analyticsEvents).where(gte(analyticsEvents.createdAt, since7d)),
    [{ value: 0 }]
  );

  const funnelNames = [
    "page_view",
    "cta_click",
    "register_complete",
    "login_complete",
    "generation_complete",
    "paywall_view",
    "payment_click"
  ] as const;

  const funnelRows = await safeAnalyticsQuery(
    "funnel rows",
    db
      .select({
        eventName: analyticsEvents.eventName,
        value: count()
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "conversion"),
          gte(analyticsEvents.createdAt, since30d)
        )
      )
      .groupBy(analyticsEvents.eventName),
    []
  );

  const pageViews = await safeAnalyticsQuery(
    "page views",
    db
      .select({ value: count() })
      .from(analyticsEvents)
      .where(
        and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, since30d))
      ),
    [{ value: 0 }]
  );

  const funnel = {
    pageViews: pageViews[0]?.value ?? 0,
    ctaClicks: funnelRows.find((row) => row.eventName === "cta_click")?.value ?? 0,
    registrations: funnelRows.find((row) => row.eventName === "register_complete")?.value ?? 0,
    logins: funnelRows.find((row) => row.eventName === "login_complete")?.value ?? 0,
    generations: funnelRows.find((row) => row.eventName === "generation_complete")?.value ?? 0,
    paywallViews: funnelRows.find((row) => row.eventName === "paywall_view")?.value ?? 0,
    paymentClicks: funnelRows.find((row) => row.eventName === "payment_click")?.value ?? 0
  };

  const heatmapRows = await safeAnalyticsQuery(
    "heatmap rows",
    db
      .select({
        xPercent: analyticsEvents.xPercent,
        yPercent: analyticsEvents.yPercent,
        value: count()
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "click"),
          eq(analyticsEvents.path, pathFilter),
          gte(analyticsEvents.createdAt, since30d)
        )
      )
      .groupBy(analyticsEvents.xPercent, analyticsEvents.yPercent)
      .orderBy(desc(count()))
      .limit(400),
    []
  );

  const topClicks = await safeAnalyticsQuery(
    "top clicks",
    db
      .select({
        label: analyticsEvents.label,
        eventName: analyticsEvents.eventName,
        value: count()
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "click"), gte(analyticsEvents.createdAt, since30d)))
      .groupBy(analyticsEvents.label, analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(15),
    []
  );

  const signupsByDay = await safeAnalyticsQuery(
    "signups by day",
    db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${users.createdAt} / 1000, 'unixepoch')`,
        value: count()
      })
      .from(users)
      .where(gte(users.createdAt, since30d))
      .groupBy(sql`strftime('%Y-%m-%d', ${users.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`day`),
    []
  );

  const generationsByDay = await safeAnalyticsQuery(
    "generations by day",
    db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${analyticsEvents.createdAt} / 1000, 'unixepoch')`,
        value: count()
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, "generation_complete"),
          gte(analyticsEvents.createdAt, since30d)
        )
      )
      .groupBy(sql`strftime('%Y-%m-%d', ${analyticsEvents.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`day`),
    []
  );

  const recentUsers = await safeAnalyticsQuery(
    "recent users",
    db.query.users.findMany({
      orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)],
      limit: 10,
      columns: {
        id: true,
        name: true,
        email: true,
        generationsUsed: true,
        generationCredits: true,
        createdAt: true
      }
    }),
    []
  );

  return {
    overview: {
      users: userCount?.value ?? 0,
      cards: cardCount?.value ?? 0,
      totalGenerations: Number(generationsSum?.value ?? 0),
      events7d: events7d?.value ?? 0
    },
    funnel,
    heatmap: heatmapRows
      .filter((row) => row.xPercent != null && row.yPercent != null)
      .map((row) => ({
        x: row.xPercent as number,
        y: row.yPercent as number,
        count: row.value
      })),
    topClicks: topClicks.map((row) => ({
      label: row.label || row.eventName,
      count: row.value
    })),
    signupsByDay,
    generationsByDay,
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      generationsUsed: user.generationsUsed,
      generationCredits: user.generationCredits,
      createdAt: user.createdAt
    })),
    trackedFunnelEvents: funnelNames
  };
}
