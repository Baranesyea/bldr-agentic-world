CREATE TYPE "public"."activity_feed_type" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."activity_trigger" AS ENUM('new_course', 'new_lesson', 'new_event', 'new_recording', 'new_qa', 'custom');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('text', 'file', 'link', 'screenshot');--> statement-breakpoint
CREATE TYPE "public"."avatar_type" AS ENUM('uploaded', 'generated');--> statement-breakpoint
CREATE TYPE "public"."chat_channel_type" AS ENUM('general', 'course', 'pod');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'active', 'archive');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('live', 'office_hours', 'brainstorm');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('push', 'email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_class" AS ENUM('reply', 'mention', 'event', 'lesson', 'pod', 'creator', 'general');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'watching', 'completed');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('pending', 'answered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."reputation_event_type" AS ENUM('module_complete', 'assignment_done', 'helped_peer', 'event_attend', 'pod_checkin', 'qa_published');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('attending', 'maybe', 'declined');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('not_submitted', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'admin', 'tourist');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('youtube', 'vimeo', 'loom');--> statement-breakpoint
CREATE TABLE "activity_feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "activity_feed_type" DEFAULT 'auto' NOT NULL,
	"trigger" "activity_trigger",
	"title" varchar(500) NOT NULL,
	"body" text,
	"image_url" text,
	"link_url" text,
	"link_label" varchar(100),
	"is_read_by" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"type" "assignment_type" DEFAULT 'text' NOT NULL,
	"instructions" text,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" "event_type" DEFAULT 'live' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"recording_url" text,
	"transcript_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"drip_unlock_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "chat_channel_type" DEFAULT 'general' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"thumbnail" text,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"drip_enabled" boolean DEFAULT false,
	"drip_start_offset" integer,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"icon" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"pinned" boolean DEFAULT false,
	"locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"parent_reply_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"video_url" text,
	"video_provider" "video_provider",
	"duration" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"has_assignment" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid,
	"content" text NOT NULL,
	"video_timestamp" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"class" "notification_class" NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pod_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pod_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"done_this_week" text,
	"goal_next_week" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"members" jsonb DEFAULT '[]'::jsonb,
	"chat_channel_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"level_name" varchar(50) DEFAULT 'Explorer',
	"badges" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "reputation_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "reputation_event_type" NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "rsvp_status" DEFAULT 'attending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text,
	"files" jsonb DEFAULT '[]'::jsonb,
	"status" "submission_status" DEFAULT 'not_submitted' NOT NULL,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "support_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"media_link" text,
	"status" "question_status" DEFAULT 'pending' NOT NULL,
	"admin_response" text,
	"admin_response_media" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "theme_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_color" varchar(20) DEFAULT '#0000FF',
	"secondary_color" varchar(20) DEFAULT '#050510',
	"font_heading" varchar(100),
	"font_body" varchar(100),
	"logo_url" text,
	"favicon_url" text
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp,
	"watch_position" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"avatar_url" text,
	"avatar_type" "avatar_type" DEFAULT 'generated',
	"bio" text,
	"current_projects" text,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Jerusalem',
	"notification_prefs" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_checkins" ADD CONSTRAINT "pod_checkins_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_checkins" ADD CONSTRAINT "pod_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_chat_channel_id_chat_channels_id_fk" FOREIGN KEY ("chat_channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation" ADD CONSTRAINT "reputation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_questions" ADD CONSTRAINT "support_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;