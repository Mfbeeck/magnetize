-- Drop the old idea_iteration column and unique constraint
ALTER TABLE "ideas" DROP CONSTRAINT IF EXISTS "ideas_magnet_request_id_iteration_unique";
ALTER TABLE "ideas" DROP COLUMN IF EXISTS "idea_iteration";

-- Remove creation_prompt and magnet_spec from ideas table (they'll be in iterations)
ALTER TABLE "ideas" DROP COLUMN IF EXISTS "creation_prompt";
ALTER TABLE "ideas" DROP COLUMN IF EXISTS "magnet_spec";

-- Create the idea_iterations table
CREATE TABLE "idea_iterations" (
  "id" serial PRIMARY KEY NOT NULL,
  "idea_id" integer NOT NULL,
  "version" integer NOT NULL,
  "name" text NOT NULL,
  "summary" text NOT NULL,
  "detailed_description" text NOT NULL,
  "why_this" text NOT NULL,
  "creation_prompt" text,
  "magnet_spec" text,
  "complexity_level" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "idea_iterations_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE
);

-- Add unique constraint to ensure one version per idea
ALTER TABLE "idea_iterations" ADD CONSTRAINT "idea_iterations_idea_id_version_unique" UNIQUE ("idea_id", "version"); 