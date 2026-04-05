CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body_html" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "mood" integer;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "page_url" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "status" varchar(50) DEFAULT 'new';