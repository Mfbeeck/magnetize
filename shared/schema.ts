import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leadMagnetRequests = pgTable("lead_magnet_requests", {
  id: serial("id").primaryKey(),
  prodDescription: text("prod_description").notNull(),
  targetAudience: text("target_audience").notNull(),
  location: text("location"),
  ideas: jsonb("ideas").notNull(),
});

export const insertLeadMagnetRequestSchema = createInsertSchema(leadMagnetRequests).pick({
  prodDescription: true,
  targetAudience: true,
  location: true,
});

export const generateIdeasSchema = z.object({
  prodDescription: z.string().min(1, "Product description is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  location: z.string().optional(),
});

export interface LeadMagnetIdea {
  name: string;
  summary: string;
  detailedDescription: string;
  valueProposition: string;
  leadConnection: string;
  creationPrompt: string;
  complexityLevel: "Simple" | "Moderate" | "Advanced";
}

export interface GenerateIdeasResponse {
  ideas: LeadMagnetIdea[];
}

export type InsertLeadMagnetRequest = z.infer<typeof insertLeadMagnetRequestSchema>;
export type LeadMagnetRequest = typeof leadMagnetRequests.$inferSelect;
