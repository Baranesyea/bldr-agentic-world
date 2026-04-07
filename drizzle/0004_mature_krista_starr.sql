CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resend_id" varchar(100),
	"to_email" varchar(500) NOT NULL,
	"from_email" varchar(500),
	"subject" varchar(500) NOT NULL,
	"template_slug" varchar(100),
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"delivered_at" timestamp,
	"bounced_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"parent_reply_id" uuid,
	"user_id" uuid,
	"user_name" varchar(255),
	"user_email" varchar(255),
	"content" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(500) NOT NULL,
	"user_name" varchar(255),
	"stars" integer NOT NULL,
	"text" text,
	"wants_video" boolean DEFAULT false,
	"video_sent" boolean DEFAULT false,
	"webhook_sent" boolean DEFAULT false,
	"trigger_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "course_name" varchar(500);--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "lesson_title" varchar(500);--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "user_email" varchar(255);--> statement-breakpoint
ALTER TABLE "support_questions" ADD COLUMN "resolved_by_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "question_replies" ADD CONSTRAINT "question_replies_question_id_support_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."support_questions"("id") ON DELETE cascade ON UPDATE no action;