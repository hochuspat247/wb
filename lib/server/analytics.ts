import { and, count, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents, demoGenerations, productCards, users, videoGenerationOrders, visitorPresence } from "@/lib/db/schema";
import type { AdminProductId } from "@/lib/admin/products";
import { buildSessionDurationStats } from "@/lib/server/session-duration";
import { getFunnel7d, type Funnel7dStep } from "@/lib/server/funnel7d";
import { getStoryStudioAdminData } from "@/lib/server/storyAdminAnalytics";

function productPathFilter(column: typeof analyticsEvents.path, product: AdminProductId): SQL {
  if (product === "storystudio") {
    return sql`${column} LIKE '/storystudio%'`;
  }
  return sql`${column} NOT LIKE '/storystudio%'`;
}

function productPresenceFilter(column: typeof visitorPresence.path, product: AdminProductId): SQL {
  if (product === "storystudio") {
    return sql`${column} LIKE '/storystudio%'`;
  }
  return sql`${column} NOT LIKE '/storystudio%'`;
}

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

export async function getAdminAnalytics(pathFilter = "/", product: AdminProductId = "marketcard") {
  const since7d = daysAgo(7);
  const since30d = daysAgo(30);
  const pathScope = productPathFilter(analyticsEvents.path, product);

  const [userCount] = await safeAnalyticsQuery("user count", db.select({ value: count() }).from(users), [{ value: 0 }]);
  const [cardCount] = await safeAnalyticsQuery("card count", db.select({ value: count() }).from(productCards), [{ value: 0 }]);
  const [demoCount] = await safeAnalyticsQuery("demo count", db.select({ value: count() }).from(demoGenerations), [{ value: 0 }]);
  const [generationsSum] = await safeAnalyticsQuery(
    "generations sum",
    db.select({ value: sql<number>`coalesce(sum(${users.generationsUsed}), 0)` }).from(users),
    [{ value: 0 }]
  );

  const [events7d] = await safeAnalyticsQuery(
    "events 7d",
    db
      .select({ value: count() })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, since7d), pathScope)),
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
          gte(analyticsEvents.createdAt, since30d),
          pathScope
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
      .where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, since30d), pathScope)),
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
          gte(analyticsEvents.createdAt, since30d),
          pathScope
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
      .where(and(eq(analyticsEvents.eventType, "click"), gte(analyticsEvents.createdAt, since30d), pathScope))
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
          gte(analyticsEvents.createdAt, since30d),
          pathScope
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
        emailVerified: true,
        passwordHash: true,
        generationsUsed: true,
        generationCredits: true,
        createdAt: true
      }
    }),
    []
  );

  const recentCards = await safeAnalyticsQuery(
    "recent cards",
    db
      .select({
        id: productCards.id,
        userId: productCards.userId,
        payload: productCards.payload,
        createdAt: productCards.createdAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(productCards)
      .leftJoin(users, eq(productCards.userId, users.id))
      .orderBy(desc(productCards.createdAt))
      .limit(20),
    []
  );

  const recentDemos = await safeAnalyticsQuery(
    "recent demo generations",
    db
      .select({
        id: demoGenerations.id,
        guestId: demoGenerations.guestId,
        userId: demoGenerations.userId,
        status: demoGenerations.status,
        payload: demoGenerations.payload,
        createdAt: demoGenerations.createdAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(demoGenerations)
      .leftJoin(users, eq(demoGenerations.userId, users.id))
      .orderBy(desc(demoGenerations.createdAt))
      .limit(20),
    []
  );

  const recentDemoErrors = await safeAnalyticsQuery(
    "recent demo errors",
    db
      .select({
        id: analyticsEvents.id,
        eventName: analyticsEvents.eventName,
        path: analyticsEvents.path,
        sessionId: analyticsEvents.sessionId,
        userId: analyticsEvents.userId,
        metadata: analyticsEvents.metadata,
        createdAt: analyticsEvents.createdAt
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "conversion"),
          inArray(analyticsEvents.eventName, ["hero_demo_generate_error", "demo_generation_error"]),
          pathScope
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(30),
    []
  );

  const journeySessions = await safeAnalyticsQuery(
    "journey sessions",
    db
      .select({
        sessionId: analyticsEvents.sessionId,
        firstSeenAt: sql<Date>`min(${analyticsEvents.createdAt})`,
        lastSeenAt: sql<Date>`max(${analyticsEvents.createdAt})`,
        eventsCount: count(),
        pageViews: sql<number>`sum(case when ${analyticsEvents.eventType} = 'page_view' then 1 else 0 end)`,
        clicks: sql<number>`sum(case when ${analyticsEvents.eventType} = 'click' then 1 else 0 end)`,
        conversions: sql<number>`sum(case when ${analyticsEvents.eventType} = 'conversion' then 1 else 0 end)`
      })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, since30d), pathScope))
      .groupBy(analyticsEvents.sessionId)
      .orderBy(desc(sql`max(${analyticsEvents.createdAt})`))
      .limit(15),
    []
  );

  const journeySessionIds = journeySessions.map((row) => row.sessionId);
  const [journeyEvents, journeyPresenceRows] =
    journeySessionIds.length > 0
      ? await Promise.all([
          safeAnalyticsQuery(
            "journey events",
            db
              .select({
                sessionId: analyticsEvents.sessionId,
                eventType: analyticsEvents.eventType,
                eventName: analyticsEvents.eventName,
                path: analyticsEvents.path,
                label: analyticsEvents.label,
                userId: analyticsEvents.userId,
                metadata: analyticsEvents.metadata,
                createdAt: analyticsEvents.createdAt
              })
              .from(analyticsEvents)
              .where(inArray(analyticsEvents.sessionId, journeySessionIds))
              .orderBy(analyticsEvents.createdAt),
            []
          ),
          safeAnalyticsQuery(
            "journey presence",
            db
              .select({
                sessionId: visitorPresence.sessionId,
                guestId: visitorPresence.guestId,
                userId: visitorPresence.userId,
                pathLabel: visitorPresence.pathLabel,
                lastActionLabel: visitorPresence.lastActionLabel
              })
              .from(visitorPresence)
              .where(inArray(visitorPresence.sessionId, journeySessionIds)),
            []
          )
        ])
      : [[], []];
  const journeyPresenceMap = new Map(journeyPresenceRows.map((row) => [row.sessionId, row]));

  const cardIds = recentCards.map((row) => row.id);
  const sessionDurationRows = await safeAnalyticsQuery(
    "session durations",
    db
      .select({
        sessionId: analyticsEvents.sessionId,
        durationMs: sql<number>`max(${analyticsEvents.createdAt}) - min(${analyticsEvents.createdAt})`
      })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, since30d), pathScope))
      .groupBy(analyticsEvents.sessionId),
    []
  );

  const moscowHour = sql<number>`cast(strftime('%H', ${analyticsEvents.createdAt} / 1000, 'unixepoch', '+3 hours') as integer)`;
  const activeHourRows = await safeAnalyticsQuery(
    "active hours",
    db
      .select({
        hour: moscowHour,
        value: count()
      })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, since30d), pathScope))
      .groupBy(moscowHour),
    []
  );

  const sessionDuration = buildSessionDurationStats(sessionDurationRows, activeHourRows, 30);

  const videoCountRows =
    cardIds.length > 0
      ? await safeAnalyticsQuery(
          "card video counts",
          db
            .select({
              sourceGenerationId: videoGenerationOrders.sourceGenerationId,
              value: count()
            })
            .from(videoGenerationOrders)
            .where(
              and(
                inArray(videoGenerationOrders.sourceGenerationId, cardIds),
                eq(videoGenerationOrders.status, "done"),
                sql`${videoGenerationOrders.originalVideoUrl} IS NOT NULL`
              )
            )
            .groupBy(videoGenerationOrders.sourceGenerationId),
          []
        )
      : [];
  const videoCountMap = new Map(videoCountRows.map((row) => [row.sourceGenerationId, row.value]));
  const storyStudioData = product === "storystudio" ? await getStoryStudioAdminData() : null;
  const funnel7d =
    product === "storystudio"
      ? (storyStudioData?.funnel7d ?? [])
      : await safeAnalyticsQuery("funnel 7d", getFunnel7d(), [] as Funnel7dStep[]);

  return {
    product,
    overview: {
      users: userCount?.value ?? 0,
      cards: cardCount?.value ?? 0,
      demoGenerations: demoCount?.value ?? 0,
      totalGenerations: Number(generationsSum?.value ?? 0),
      events7d: events7d?.value ?? 0
    },
    funnel,
    funnel7d,
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
    sessionDuration,
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      hasPasswordAccount: Boolean(user.passwordHash),
      generationsUsed: user.generationsUsed,
      generationCredits: user.generationCredits,
      createdAt: user.createdAt
    })),
    recentCards: recentCards.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      title: row.payload.title,
      marketplace: row.payload.marketplace,
      style: row.payload.style,
      category: row.payload.category,
      generatedAt: row.payload.generatedAt,
      createdAt: row.createdAt,
      generationRating: row.payload.generationRating,
      videoCount: videoCountMap.get(row.id) ?? row.payload.generatedVideos?.length ?? (row.payload.generatedVideoUrl ? 1 : 0)
    })),
    recentDemos: recentDemos.map((row) => ({
      id: row.id,
      guestId: row.guestId,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      status: row.status,
      title: row.payload.title,
      category: row.payload.category,
      marketplace: row.payload.marketplace,
      productDescription: row.payload.sourceInput?.productDescription || row.payload.shortDescription,
      generatedAt: row.payload.generatedAt,
      createdAt: row.createdAt,
      generationRating: row.payload.generationRating,
      generationRatingDismissedAt: row.payload.generationRatingDismissedAt,
      provider: row.payload.generatedImageProvider || row.payload.provider
    })),
    recentDemoErrors: recentDemoErrors.map((row) => ({
      id: row.id,
      eventName: row.eventName,
      path: row.path,
      sessionId: row.sessionId,
      userId: row.userId,
      guestId: typeof row.metadata?.guestId === "string" ? row.metadata.guestId : null,
      message: typeof row.metadata?.message === "string" ? row.metadata.message : "Без описания",
      code: typeof row.metadata?.code === "string" ? row.metadata.code : null,
      status: typeof row.metadata?.status === "number" ? row.metadata.status : null,
      source: typeof row.metadata?.source === "string" ? row.metadata.source : null,
      createdAt: row.createdAt
    })),
    userJourneys: journeySessions.map((session) => {
      const events = journeyEvents.filter((event) => event.sessionId === session.sessionId);
      const presence = journeyPresenceMap.get(session.sessionId);
      const paths = Array.from(new Set(events.map((event) => event.path))).slice(0, 8);

      return {
        sessionId: session.sessionId,
        guestId: presence?.guestId ?? null,
        userId: presence?.userId ?? events.find((event) => event.userId)?.userId ?? null,
        firstSeenAt: session.firstSeenAt,
        lastSeenAt: session.lastSeenAt,
        eventsCount: session.eventsCount,
        pageViews: Number(session.pageViews ?? 0),
        clicks: Number(session.clicks ?? 0),
        conversions: Number(session.conversions ?? 0),
        currentPathLabel: presence?.pathLabel ?? null,
        lastActionLabel: presence?.lastActionLabel ?? null,
        paths,
        events: events.slice(-12).map((event) => ({
          eventType: event.eventType,
          eventName: event.eventName,
          path: event.path,
          label: event.label,
          createdAt: event.createdAt
        }))
      };
    }),
    trackedFunnelEvents: funnelNames,
    storyStudio: storyStudioData
      ? {
          overview: storyStudioData.overview,
          recentStories: storyStudioData.recentStories
        }
      : null
  };
}
