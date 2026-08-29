//schema.ts
//import { pgTable, pgEnum, bigint, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgTable, pgEnum, bigint, smallint, varchar, text, boolean, integer, timestamp, primaryKey, check, uniqueIndex ,unique} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default("user"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorProfiles = pgTable("creator_profiles", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  channelDescription: text("channel_description"),
  channelBannerUrl: text("channel_banner_url"),
  payoutMethod: varchar("payout_method", { length: 30 }),
  payoutDetailsEncrypted: text("payout_details_encrypted"),
  monetizationEnabled: boolean("monetization_enabled").notNull().default(false),
  totalEarningsCents: bigint("total_earnings_cents", { mode: "number" }).notNull().default(0),
  becameCreatorAt: timestamp("became_creator_at", { withTimezone: true }).notNull().defaultNow(),
});



export const videoStatusEnum = pgEnum("video_status", ["processing", "ready", "failed"]);

export const categories = pgTable("categories", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const videos = pgTable("videos", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  creatorId: bigint("creator_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  categoryId: smallint("category_id")
    .references(() => categories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  status: videoStatusEnum("status").notNull().default("processing"),
  videoUrl: text("video_url"),
  durationSeconds: integer("duration_seconds"),
  viewCount: bigint("view_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});



export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due"]);
export const paymentTypeEnum = pgEnum("payment_type", ["tip", "subscription_charge"]);
export const paymentStatusEnum = pgEnum("payment_status", ["succeeded", "failed", "refunded"]);

export const follows = pgTable("follows", {
  followerId: bigint("follower_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: bigint("creator_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.creatorId] }),
  check("no_self_follow", sql`${table.followerId} != ${table.creatorId}`),
]);

export const subscriptions = pgTable("subscriptions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  subscriberId: bigint("subscriber_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  creatorId: bigint("creator_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  renewsAt: timestamp("renews_at", { withTimezone: true }).notNull(),
}, (table) => [
  //{ uniqueSubscriberCreator: { columns: [table.subscriberId, table.creatorId], unique: true } },
    unique("unique_subscriber_creator").on(table.subscriberId, table.creatorId),
]);

export const payments = pgTable("payments", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  payerId: bigint("payer_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  payeeId: bigint("payee_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: paymentTypeEnum("type").notNull(),
  subscriptionId: bigint("subscription_id", { mode: "number" })
    .references(() => subscriptions.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: paymentStatusEnum("status").notNull(),
 gatewayEventId: varchar("gateway_event_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("positive_amount", sql`${table.amountCents} > 0`),
]);
export const pendingCheckouts = pgTable("pending_checkouts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar("order_id", { length: 255 }).notNull().unique(),
  subscriberId: bigint("subscriber_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict" }),
  creatorId: bigint("creator_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | completed | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const liveStreamStatusEnum = pgEnum("live_stream_status", ["live", "ended"]);

export const liveStreams = pgTable("live_streams", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  creatorId: bigint("creator_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 150 }).notNull(),
  status: liveStreamStatusEnum("status").notNull().default("live"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  peakViewerCount: integer("peak_viewer_count").notNull().default(0),
}, (table) => [
  check("ended_streams_have_end_time", sql`${table.status} = 'live' OR ${table.endedAt} IS NOT NULL`),
  uniqueIndex("one_live_stream_per_creator")
    .on(table.creatorId)
    .where(sql`${table.status} = 'live'`),
]);

export const chatMessages = pgTable("chat_messages", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  liveStreamId: bigint("live_stream_id", { mode: "number" })
    .notNull()
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  message: varchar("message", { length: 500 }).notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reactionTypeEnum = pgEnum("reaction_type", ["like", "love", "fire"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "dismissed"]);

// --- Tags ---
export const tags = pgTable("tags", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 30 }).notNull().unique(),
});

export const videoTags = pgTable("video_tags", {
  videoId: bigint("video_id", { mode: "number" })
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  tagId: bigint("tag_id", { mode: "number" })
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.videoId, table.tagId] }),
]);

// --- Comments ---
export const comments = pgTable("comments", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  videoId: bigint("video_id", { mode: "number" })
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Reactions ---
export const reactions = pgTable("reactions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  videoId: bigint("video_id", { mode: "number" })
    .references(() => videos.id, { onDelete: "cascade" }),
  liveStreamId: bigint("live_stream_id", { mode: "number" })
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: reactionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check(
    "exactly_one_target",
    sql`(${table.videoId} IS NOT NULL) != (${table.liveStreamId} IS NOT NULL)`
  ),
]);

// --- Moderation ---
export const moderationReports = pgTable("moderation_reports", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  reporterId: bigint("reporter_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  reportedUserId: bigint("reported_user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  chatMessageId: bigint("chat_message_id", { mode: "number" })
    .references(() => chatMessages.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  reviewedBy: bigint("reviewed_by", { mode: "number" })
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformBans = pgTable("platform_bans", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  bannedBy: bigint("banned_by", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  //id: text("id").primaryKey(),
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  //id: text("id").primaryKey(),
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
 // id: text("id").primaryKey(),
   id: text("id").primaryKey().default(sql`gen_random_uuid()::text`), 
 identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});