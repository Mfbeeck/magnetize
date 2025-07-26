import { pgTable, text, serial, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Magnet Requests table
export const magnetRequests = pgTable("magnet_requests", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(), // Randomly generated ID for sharing
  prodDescription: text("prod_description").notNull(),
  targetAudience: text("target_audience").notNull(),
  location: text("location"),
  businessUrl: text("business_url").notNull(), // Required business website
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ideas table
export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  magnetRequestId: integer("magnet_request_id").notNull().references(() => magnetRequests.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  detailedDescription: text("detailed_description").notNull(),
  whyThis: text("why_this").notNull(),
  creationPrompt: text("creation_prompt"), // Will be generated later
  magnetSpec: text("magnet_spec"), // Will be generated later
  complexityLevel: text("complexity_level").notNull(), // "Simple" | "Moderate" | "Advanced"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Help Requests table
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").notNull().references(() => ideas.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Define relationships
export const magnetRequestsRelations = relations(magnetRequests, ({ many }) => ({
  ideas: many(ideas),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  magnetRequest: one(magnetRequests, {
    fields: [ideas.magnetRequestId],
    references: [magnetRequests.id],
  }),
  helpRequests: many(helpRequests),
}));

export const helpRequestsRelations = relations(helpRequests, ({ one }) => ({
  idea: one(ideas, {
    fields: [helpRequests.ideaId],
    references: [ideas.id],
  }),
}));

// Schemas for validation
export const insertMagnetRequestSchema = createInsertSchema(magnetRequests).pick({
  prodDescription: true,
  targetAudience: true,
  location: true,
  businessUrl: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  magnetRequestId: true,
  name: true,
  summary: true,
  detailedDescription: true,
  whyThis: true,
  complexityLevel: true,
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).pick({
  ideaId: true,
  email: true,
});

export const generateIdeasSchema = z.object({
  prodDescription: z.string().min(1, "Product description is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  location: z.string().optional(),
  businessUrl: z.string()
    .min(1, "Business website URL is required")
    .refine((url) => {
      if (!url || !url.trim()) return false;
      
      // Allow URLs with or without protocol
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      try {
        const parsedUrl = new URL(urlWithProtocol);
        
        // Check that it has a valid hostname (domain)
        if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) return false;
        
        // Check that it has a valid domain structure (at least one dot and valid characters)
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(parsedUrl.hostname)) return false;
        
        // Check that it's not just a localhost or IP address
        if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') return false;
        
        return true;
      } catch {
        return false;
      }
    }, "Must be a valid website URL (e.g., example.com or https://example.com)"),
});

export interface LeadMagnetIdea {
  id?: number;
  name: string;
  summary: string;
  detailedDescription: string;
  whyThis: string;
  creationPrompt?: string;
  magnetSpec?: string;
  complexityLevel: "Simple" | "Moderate" | "Advanced";
}

export interface GenerateIdeasResponse {
  ideas: LeadMagnetIdea[];
  magnetRequestId: number;
  publicId: string;
  businessUrl: string;
}

export type InsertMagnetRequest = z.infer<typeof insertMagnetRequestSchema>;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type MagnetRequest = typeof magnetRequests.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type HelpRequest = typeof helpRequests.$inferSelect;
