-- Add unique constraint to ensure we can have multiple iterations of the same idea
-- This allows us to have multiple rows with the same magnetRequestId but different ideaIteration values
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_magnet_request_id_iteration_unique" UNIQUE ("magnet_request_id", "idea_iteration"); 