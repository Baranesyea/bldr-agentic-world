import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============================================
// Enums
// ============================================
export const courseStatusEnum = pgEnum("course_status", ["draft", "active", "archive"]);
export const userRoleEnum = pgEnum("user_role", ["member", "admin"]);
export const progressStatusEnum = pgEnum("progress_status", ["not_started", "watching", "completed"]);
export const submissionStatusEnum = pgEnum("submission_status", ["not_submitted", "submitted"]);
export const questionStatusEnum = pgEnum("question_status", ["pending", "answered", "rejected"]);
export const eventTypeEnum = pgEnum("event_type", ["live", "office_hours", "brainstorm"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["attending", "maybe", "declined"]);
export const chatChannelTypeEnum = pgEnum("chat_channel_type", ["general", "course", "pod"]);
export const notificationClassEnum = pgEnum("notification_class", ["reply", "mention", "event", "lesson", "pod", "creator", "general"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["push", "email", "in_app"]);
export const activityFeedTypeEnum = pgEnum("activity_feed_type", ["auto", "manual"]);
export const activityTriggerEnum = pgEnum("activity_trigger", ["new_course", "new_lesson", "new_event", "new_recording", "new_qa", "custom"]);
export const avatarTypeEnum = pgEnum("avatar_type", ["uploaded", "generated"]);
export const assignmentTypeEnum = pgEnum("assignment_type", ["text", "file", "link", "screenshot"]);
export const videoProviderEnum = pgEnum("video_provider", ["youtube", "vimeo", "loom"]);
export const reputationEventTypeEnum = pgEnum("reputation_event_type", [
  "module_complete", "assignment_done", "helped_peer", "event_attend", "pod_checkin", "qa_published",
]);

// ============================================
// Layer 0: Users
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  avatarType: avatarTypeEnum("avatar_type").default("generated"),
  bio: text("bio"),
  currentProjects: text("current_projects"),
  role: userRoleEnum("role").default("member").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Jerusalem"),
  notificationPrefs: jsonb("notification_prefs").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Layer 1: Course Structure & Content
// ============================================
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  status: courseStatusEnum("status").default("draft").notNull(),
  dripEnabled: boolean("drip_enabled").default(false),
  dripStartOffset: integer("drip_start_offset"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  dripUnlockDate: timestamp("drip_unlock_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  videoProvider: videoProviderEnum("video_provider"),
  duration: integer("duration"),
  displayOrder: integer("display_order").default(0).notNull(),
  attachments: jsonb("attachments").default([]),
  hasAssignment: boolean("has_assignment").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  type: assignmentTypeEnum("type").default("text").notNull(),
  instructions: text("instructions"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  files: jsonb("files").default([]),
  status: submissionStatusEnum("status").default("not_submitted").notNull(),
  submittedAt: timestamp("submitted_at"),
});

export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  status: progressStatusEnum("status").default("not_started").notNull(),
  completedAt: timestamp("completed_at"),
  watchPosition: integer("watch_position").default(0),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  videoTimestamp: varchar("video_timestamp", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Layer 2: Community Experience
// ============================================
export const forumCategories = pgTable("forum_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  icon: varchar("icon", { length: 50 }),
});

export const forumPosts = pgTable("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => forumCategories.id),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body").notNull(),
  tags: jsonb("tags").default([]),
  pinned: boolean("pinned").default(false),
  locked: boolean("locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const forumReplies = pgTable("forum_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  parentReplyId: uuid("parent_reply_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportQuestions = pgTable("support_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  mediaLink: text("media_link"),
  status: questionStatusEnum("status").default("pending").notNull(),
  adminResponse: text("admin_response"),
  adminResponseMedia: text("admin_response_media"),
  tags: jsonb("tags").default([]),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at"),
});

export const chatChannels = pgTable("chat_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: chatChannelTypeEnum("type").default("general").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: eventTypeEnum("type").default("live").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rsvps = pgTable("rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: rsvpStatusEnum("status").default("attending").notNull(),
});

// ============================================
// Layer 3: Accountability & Progress
// ============================================
export const pods = pgTable("pods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  members: jsonb("members").default([]),
  chatChannelId: uuid("chat_channel_id").references(() => chatChannels.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const podCheckins = pgTable("pod_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  podId: uuid("pod_id").notNull().references(() => pods.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  doneThisWeek: text("done_this_week"),
  goalNextWeek: text("goal_next_week"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reputation = pgTable("reputation", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalPoints: integer("total_points").default(0).notNull(),
  levelName: varchar("level_name", { length: 50 }).default("Explorer"),
  badges: jsonb("badges").default([]),
});

export const reputationEvents = pgTable("reputation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: reputationEventTypeEnum("type").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Dashboard & Notifications
// ============================================
export const activityFeedItems = pgTable("activity_feed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: activityFeedTypeEnum("type").default("auto").notNull(),
  trigger: activityTriggerEnum("trigger"),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkLabel: varchar("link_label", { length: 100 }),
  isReadBy: jsonb("is_read_by").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  class: notificationClassEnum("class").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  channel: notificationChannelEnum("channel").default("in_app").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Theme Settings
// ============================================
export const themeSettings = pgTable("theme_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  primaryColor: varchar("primary_color", { length: 20 }).default("#0000FF"),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#050510"),
  fontHeading: varchar("font_heading", { length: 100 }),
  fontBody: varchar("font_body", { length: 100 }),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
});
