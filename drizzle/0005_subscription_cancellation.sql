CREATE TYPE "public"."billing_cycle" AS ENUM ('monthly', 'one_time');--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "billing_cycle" "billing_cycle" DEFAULT 'one_time';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "subscription_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "cancellation_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "cancellation_effective_at" timestamp;
