ALTER TABLE "email_templates" ADD COLUMN "whatsapp_body" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "last_password_link_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "last_password_link_email_status" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "last_password_link_whatsapp_status" varchar(20);--> statement-breakpoint
CREATE TABLE "notification_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "to_email" varchar(500),
  "to_phone" varchar(50),
  "channel" varchar(20) NOT NULL,
  "template_slug" varchar(100),
  "status" varchar(50) NOT NULL,
  "external_id" varchar(200),
  "error" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
