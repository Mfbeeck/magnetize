CREATE TABLE IF NOT EXISTS "idea_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"feedback_rating" integer NOT NULL,
	"feedback_comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idea_feedback_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE
); 