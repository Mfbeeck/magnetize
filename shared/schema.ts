import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leadMagnetRequests = pgTable("lead_magnet_requests", {
  id: serial("id").primaryKey(),
  businessType: text("business_type").notNull(),
  targetAudience: text("target_audience").notNull(),
  location: text("location"),
  ideas: jsonb("ideas").notNull(),
});

export const insertLeadMagnetRequestSchema = createInsertSchema(leadMagnetRequests).pick({
  businessType: true,
  targetAudience: true,
  location: true,
});

export const generateIdeasSchema = z.object({
  businessType: z.string().min(1, "Business type is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  location: z.string().optional(),
});

export interface LeadMagnetIdea {
  name: string;
  coreFunction: string;
  detailedDescription: string;
  valueProposition: string;
  leadConnection: string;
  complexityLevel: "Simple" | "Moderate" | "Advanced";
}

export interface GenerateIdeasResponse {
  ideas: LeadMagnetIdea[];
}

export type InsertLeadMagnetRequest = z.infer<typeof insertLeadMagnetRequestSchema>;
export type LeadMagnetRequest = typeof leadMagnetRequests.$inferSelect;
