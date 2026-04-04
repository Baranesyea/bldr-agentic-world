CREATE TYPE "public"."expiry_mode" AS ENUM('full_lock', 'partial_lock');--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid,
	"imported_by" uuid NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"field_mapping" jsonb DEFAULT '{}'::jsonb,
	"course_availability" jsonb DEFAULT '{}'::jsonb,
	"access_expires_at" timestamp,
	"expiry_mode" "expiry_mode",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"available_after_expiry" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'student' NOT NULL,
	"access_expires_at" timestamp,
	"expiry_mode" "expiry_mode" DEFAULT 'full_lock',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"logo_url" text,
	"whatsapp_link" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_course_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"school_id" uuid,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "school_id" uuid;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "access_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "expiry_mode" "expiry_mode" DEFAULT 'full_lock';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_school_id" uuid;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_courses" ADD CONSTRAINT "school_courses_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_courses" ADD CONSTRAINT "school_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "school_courses_school_course_idx" ON "school_courses" USING btree ("school_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_memberships_user_school_idx" ON "school_memberships" USING btree ("user_id","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_course_access_user_course_school_idx" ON "user_course_access" USING btree ("user_id","course_id","school_id");