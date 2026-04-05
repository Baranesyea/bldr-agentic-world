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
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// Enums
// ============================================
export const courseStatusEnum = pgEnum("course_status", ["draft", "active", "archive", "coming_soon"]);
export const userRoleEnum = pgEnum("user_role", ["member", "admin", "tourist"]);
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
export const expiryModeEnum = pgEnum("expiry_mode", ["full_lock", "partial_lock"]);

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
  activeSchoolId: uuid("active_school_id"),
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
  slug: varchar("slug", { length: 500 }).unique(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  status: courseStatusEnum("status").default("draft").notNull(),
  featured: boolean("featured").default(false),
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
  slug: varchar("slug", { length: 500 }),
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
// Case Studies
// ============================================
export const caseStudies = pgTable("case_studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  category: varchar("category", { length: 255 }),
  content: text("content"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Knowledge Base
// ============================================
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 255 }),
  tags: jsonb("tags").default([]),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// News
// ============================================
export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Members
// ============================================
export const memberStatusEnum = pgEnum("member_status", ["active", "inactive"]);
export const memberTypeEnum = pgEnum("member_type", ["free", "paid"]);

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  status: memberStatusEnum("status").default("active").notNull(),
  type: memberTypeEnum("type").default("free").notNull(),
  pricePaid: integer("price_paid").default(0),
  phone: varchar("phone", { length: 50 }),
  supabaseUserId: text("supabase_user_id"),
  notes: text("notes"),
  schoolId: uuid("school_id"),
  accessExpiresAt: timestamp("access_expires_at"),
  expiryMode: expiryModeEnum("expiry_mode").default("full_lock"),
  importBatchId: uuid("import_batch_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Admin Settings
// ============================================
export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Share Links
// ============================================
export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull(),
  courseId: uuid("course_id"),
  lessonId: uuid("lesson_id"),
  type: varchar("type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Feedback
// ============================================
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userName: varchar("user_name", { length: 255 }),
  userEmail: varchar("user_email", { length: 255 }),
  type: varchar("type", { length: 100 }),
  message: text("message"),
  rating: integer("rating"),
  category: varchar("category", { length: 100 }),
  mood: integer("mood"),
  pageUrl: text("page_url"),
  attachmentUrl: text("attachment_url"),
  status: varchar("status", { length: 50 }).default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Media Registry
// ============================================
export const mediaRegistry = pgTable("media_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 500 }),
  key: text("key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Analytics
// ============================================
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userEmail: varchar("user_email", { length: 255 }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  eventData: jsonb("event_data").default({}),
  deviceType: varchar("device_type", { length: 20 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 100 }),
  pageUrl: text("page_url"),
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

// ============================================
// Schools (Workspaces)
// ============================================
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  logoUrl: text("logo_url"),
  whatsappLink: text("whatsapp_link"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schoolMemberships = pgTable("school_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).default("student").notNull(),
  accessExpiresAt: timestamp("access_expires_at"),
  expiryMode: expiryModeEnum("expiry_mode").default("full_lock"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("school_memberships_user_school_idx").on(table.userId, table.schoolId),
]);

export const schoolCourses = pgTable("school_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").default(true).notNull(),
  availableAfterExpiry: boolean("available_after_expiry").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("school_courses_school_course_idx").on(table.schoolId, table.courseId),
]);

export const userCourseAccess = pgTable("user_course_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  schoolId: uuid("school_id").references(() => schools.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_course_access_user_course_school_idx").on(table.userId, table.courseId, table.schoolId),
]);

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
  importedBy: uuid("imported_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  totalRows: integer("total_rows").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failCount: integer("fail_count").default(0).notNull(),
  fieldMapping: jsonb("field_mapping").default({}),
  courseAvailability: jsonb("course_availability").default({}),
  accessExpiresAt: timestamp("access_expires_at"),
  expiryMode: expiryModeEnum("expiry_mode"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Layer 6: Email Templates
// ============================================
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  variables: jsonb("variables").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Layer 7: Email Logs
// ============================================
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  resendId: varchar("resend_id", { length: 100 }), // Resend's email ID for tracking
  toEmail: varchar("to_email", { length: 500 }).notNull(),
  fromEmail: varchar("from_email", { length: 500 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  templateSlug: varchar("template_slug", { length: 100 }), // which template was used
  status: varchar("status", { length: 50 }).default("sent").notNull(), // sent, delivered, opened, clicked, bounced, complained
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  deliveredAt: timestamp("delivered_at"),
  bouncedAt: timestamp("bounced_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Layer 8: Reviews
// ============================================
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userEmail: varchar("user_email", { length: 500 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  stars: integer("stars").notNull(), // 1-5
  text: text("text"),
  wantsVideo: boolean("wants_video").default(false),
  videoSent: boolean("video_sent").default(false),
  webhookSent: boolean("webhook_sent").default(false),
  triggerType: varchar("trigger_type", { length: 50 }), // "time", "login_count", "manual"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
