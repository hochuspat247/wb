import { and, count, desc, eq, gte, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { storyProjects, users, videoGenerationOrders } from "@/lib/db/schema";
import type { StoryProject } from "@/types/storystudio";
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

function sumStoryMetrics(stories: StoryProject[]) {
  return stories.reduce(
    (acc, story) => {
      acc.characters += story.characters?.length ?? 0;
      acc.chapters += story.chapters?.length ?? 0;
      acc.episodes += story.episodes?.length ?? 0;
      acc.videoEpisodes += (story.episodes ?? []).filter((e) => e.status === "done" || e.videoUrl).length;
      return acc;
    },
    { characters: 0, chapters: 0, episodes: 0, videoEpisodes: 0 }
  );
}

export async function getStoryStudioAdminData() {
  const since7d = daysAgo(7);

  const [storyCount] = await db.select({ value: count() }).from(storyProjects);

  const recentStoryRows = await db
    .select({
      id: storyProjects.id,
      userId: storyProjects.userId,
      payload: storyProjects.payload,
      createdAt: storyProjects.createdAt,
      updatedAt: storyProjects.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(storyProjects)
    .leftJoin(users, eq(storyProjects.userId, users.id))
    .orderBy(desc(storyProjects.updatedAt))
    .limit(20);

  const allStoryRows = await db.select({ payload: storyProjects.payload }).from(storyProjects);
  const metrics = sumStoryMetrics(allStoryRows.map((row) => row.payload));

  const [storyVideos] = await db
    .select({ value: count() })
    .from(videoGenerationOrders)
    .where(and(like(videoGenerationOrders.sourceGenerationId, "story:%"), eq(videoGenerationOrders.status, "done")));

  const [storyVideos7d] = await db
    .select({ value: count() })
    .from(videoGenerationOrders)
    .where(
      and(
        like(videoGenerationOrders.sourceGenerationId, "story:%"),
        eq(videoGenerationOrders.status, "done"),
        gte(videoGenerationOrders.updatedAt, since7d)
      )
    );

  const [stories7d] = await db
    .select({ value: count() })
    .from(storyProjects)
    .where(gte(storyProjects.createdAt, since7d));

  const funnel7d = buildStepPercents([
    { id: "landing", label: "Лендинг /storystudio", count: await countStoryPathViews("/storystudio", since7d) },
    { id: "create", label: "Страница создания", count: await countStoryPathViews("/storystudio/create", since7d) },
    { id: "cabinet", label: `Кабинет ${BRAND.storyStudio}`, count: await countStoryPathViews("/storystudio/cabinet", since7d) },
    { id: "stories", label: "Истории созданы (7д)", count: stories7d?.value ?? 0 },
    { id: "videos", label: "Видео-серии готовы (7д)", count: storyVideos7d?.value ?? 0 }
  ]);

  return {
    overview: {
      stories: storyCount?.value ?? 0,
      characters: metrics.characters,
      chapters: metrics.chapters,
      episodes: metrics.episodes,
      videoEpisodes: metrics.videoEpisodes,
      storyVideos: storyVideos?.value ?? 0
    },
    funnel7d,
    recentStories: recentStoryRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      title: row.payload.title,
      premise: row.payload.premise,
      status: row.payload.status,
      genres: row.payload.genres,
      charactersCount: row.payload.characters?.length ?? 0,
      chaptersCount: row.payload.chapters?.length ?? 0,
      episodesCount: row.payload.episodes?.length ?? 0,
      premiumMode: row.payload.premiumMode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))
  };
}

async function countStoryPathViews(path: string, since: Date) {
  const { analyticsEvents } = await import("@/lib/db/schema");
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
