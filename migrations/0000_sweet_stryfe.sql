CREATE TABLE "help_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"email" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"magnet_request_id" integer NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"detailed_description" text NOT NULL,
	"why_this" text NOT NULL,
	"creation_prompt" text,
	"magnet_spec" text,
	"complexity_level" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magnet_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"prod_description" text NOT NULL,
	"target_audience" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magnet_requests_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_magnet_request_id_magnet_requests_id_fk" FOREIGN KEY ("magnet_request_id") REFERENCES "public"."magnet_requests"("id") ON DELETE cascade ON UPDATE no action;