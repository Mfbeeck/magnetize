-- Add idea_iteration_id column to help_requests table
ALTER TABLE "help_requests" ADD COLUMN "idea_iteration_id" integer;

-- Add foreign key constraint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_idea_iteration_id_fkey" 
  FOREIGN KEY ("idea_iteration_id") REFERENCES "idea_iterations"("id") ON DELETE CASCADE;

-- Make idea_id nullable since we'll be using idea_iteration_id instead
ALTER TABLE "help_requests" ALTER COLUMN "idea_id" DROP NOT NULL; 