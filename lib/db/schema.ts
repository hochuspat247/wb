import type { AdapterAccountType } from "@auth/core/adapters";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { ProductCardResult } from "@/types/product-card";
import type {
  VideoAspectRatio,
  VideoDuration,
  VideoGenerationModel,
  VideoGenerationProvider,
  VideoGenerationStatus,
  VideoMotionStyle,
  VideoQuality
} from "@/types/video-generation";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  generationCredits: integer("generationCredits").notNull().default(2),
  generationsUsed: integer("generationsUsed").notNull().default(0),
  videoCredits: integer("videoCredits").notNull().default(0),
  freeCleanDownloadGenerationId: text("freeCleanDownloadGenerationId"),
  hasPurchasedGenerationCredits: integer("hasPurchasedGenerationCredits", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull()
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull()
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token]
    })
  })
);

export const productCards = sqliteTable("product_card", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  payload: text("payload", { mode: "json" }).$type<ProductCardResult>().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull()
});

export const demoGenerations = sqliteTable("demo_generation", {
  id: text("id").primaryKey(),
  guestId: text("guestId").notNull(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  clientIpHash: text("clientIpHash"),
  status: text("status").notNull().default("done"),
  payload: text("payload", { mode: "json" }).$type<ProductCardResult>().notNull(),
  originalImageBase64: text("originalImageBase64").notNull(),
  originalImageMimeType: text("originalImageMimeType").notNull(),
  previewImageBase64: text("previewImageBase64").notNull(),
  previewImageMimeType: text("previewImageMimeType").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull()
});

export const demoGenerationAttempts = sqliteTable("demo_generation_attempt", {
  id: text("id").primaryKey(),
  identityType: text("identityType").notNull(),
  identityHash: text("identityHash").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull()
});

export const imageGenerationTickets = sqliteTable("image_generation_ticket", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull().default("card_image"),
  usedAt: integer("usedAt", { mode: "timestamp_ms" }),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull()
});

export const analyticsEvents = sqliteTable("analytics_event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventType: text("eventType").notNull(),
  eventName: text("eventName").notNull(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  label: text("label"),
  xPercent: integer("xPercent"),
  yPercent: integer("yPercent"),
  viewportWidth: integer("viewportWidth"),
  viewportHeight: integer("viewportHeight"),
  userId: text("userId"),
  sessionId: text("sessionId").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, string | number | boolean>>(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const visitorPresence = sqliteTable("visitor_presence", {
  sessionId: text("sessionId").primaryKey(),
  userId: text("userId"),
  guestId: text("guestId"),
  path: text("path").notNull(),
  pathLabel: text("pathLabel"),
  section: text("section"),
  sectionLabel: text("sectionLabel"),
  lastAction: text("lastAction"),
  lastActionLabel: text("lastActionLabel"),
  referrer: text("referrer"),
  isAuthed: integer("isAuthed", { mode: "boolean" }).notNull().default(false),
  isVisible: integer("isVisible", { mode: "boolean" }).notNull().default(true),
  firstSeenAt: integer("firstSeenAt", { mode: "timestamp_ms" }).notNull(),
  lastSeenAt: integer("lastSeenAt", { mode: "timestamp_ms" }).notNull()
});

export const payments = sqliteTable("payment", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("yookassa"),
  status: text("status").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("RUB"),
  credits: integer("credits").notNull(),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  confirmationUrl: text("confirmationUrl"),
  idempotenceKey: text("idempotenceKey").notNull(),
  creditedAt: integer("creditedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});

export const videoGenerationOrders = sqliteTable("video_generation_order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceGenerationId: text("sourceGenerationId").notNull(),
  sourceImageUrl: text("sourceImageUrl").notNull(),
  provider: text("provider").$type<VideoGenerationProvider>().notNull().default("genapi"),
  model: text("model").$type<VideoGenerationModel>().notNull().default("veo-3-1-fast"),
  status: text("status").$type<VideoGenerationStatus>().notNull().default("payment_pending"),
  duration: text("duration").$type<VideoDuration>().notNull(),
  aspectRatio: text("aspectRatio").$type<VideoAspectRatio>().notNull(),
  quality: text("quality").$type<VideoQuality>().notNull(),
  motionStyle: text("motionStyle").$type<VideoMotionStyle>().notNull(),
  generateAudio: integer("generateAudio", { mode: "boolean" }).notNull().default(false),
  prompt: text("prompt").notNull(),
  amountRub: integer("amountRub"),
  paymentId: text("paymentId"),
  externalTaskId: text("externalTaskId"),
  originalVideoUrl: text("originalVideoUrl"),
  error: text("error"),
  paidAt: integer("paidAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
});
