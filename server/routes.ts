import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateIdeasSchema, type LeadMagnetIdea } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/generate-ideas", async (req, res) => {
    try {
      const validatedData = generateIdeasSchema.parse(req.body);
      const { businessType, targetAudience, location } = validatedData;

      const prompt = `You are a digital marketing strategist specializing in lead generation through value-driven web applications. Your task is to generate innovative web app ideas that can serve as lead magnets for businesses.

Business Context:
Business type: ${businessType}
Location: ${location || 'Not specified'}
Target audience: ${targetAudience}

Requirements:
Generate 7-10 web app ideas that:
- Solve a real problem your target audience faces
- Naturally lead to your paid services
- Can collect email addresses/contact info

For each idea, provide:
- App Name (creative and memorable)
- Core Function (what it does in one sentence)
- Detailed Description (explaining more about the app)
- Value Proposition (why someone would use it)
- Lead Connection (how it connects to your services)
- Complexity Level (Simple/Moderate/Advanced)

Make sure to include at least 1 idea for each complexity level.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, coreFunction, detailedDescription, valueProposition, leadConnection, complexityLevel.`;

      const response = await openai.chat.completions.create({
        model: "o3-mini", // Using o3 model as requested by user
        messages: [
          {
            role: "system",
            content: "You are a digital marketing strategist. Always respond with valid JSON containing an 'ideas' array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_completion_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.ideas || !Array.isArray(result.ideas)) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Validate each idea has required properties
      const validatedIdeas: LeadMagnetIdea[] = result.ideas.map((idea: any) => ({
        name: idea.name || "Unnamed Idea",
        coreFunction: idea.coreFunction || "No core function specified",
        detailedDescription: idea.detailedDescription || "No description provided",
        valueProposition: idea.valueProposition || "No value proposition specified",
        leadConnection: idea.leadConnection || "No lead connection specified",
        complexityLevel: idea.complexityLevel || "Simple"
      }));

      // Save request to storage
      await storage.saveLeadMagnetRequest({
        businessType,
        targetAudience,
        location: location || null,
        ideas: validatedIdeas
      });

      res.json({ ideas: validatedIdeas });
    } catch (error) {
      console.error("Error generating ideas:", error);
      res.status(500).json({ 
        error: "Failed to generate ideas", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
