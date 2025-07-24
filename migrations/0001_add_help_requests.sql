CREATE TABLE "help_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"email" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action; 