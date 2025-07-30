-- Update idea_feedback table to reference idea_iterations instead of ideas
-- First, drop the existing foreign key constraint
ALTER TABLE "idea_feedback" DROP CONSTRAINT IF EXISTS "idea_feedback_idea_id_fkey";

-- Rename the column to be more specific
ALTER TABLE "idea_feedback" RENAME COLUMN "idea_id" TO "idea_iteration_id";

-- Add the new foreign key constraint to reference idea_iterations
ALTER TABLE "idea_feedback" ADD CONSTRAINT "idea_feedback_idea_iteration_id_fkey" 
  FOREIGN KEY ("idea_iteration_id") REFERENCES "idea_iterations"("id") ON DELETE CASCADE; 