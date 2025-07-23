import 'dotenv/config';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateIdeasSchema, type LeadMagnetIdea } from "@shared/schema";
import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/generate-ideas", async (req, res) => {
    try {
      const validatedData = generateIdeasSchema.parse(req.body);
      const { prodDescription, targetAudience, location } = validatedData;

      const prompt = `You are a marketing guru and I need some advice from you. I am the CMO of a business and need help generating ideas for free web app lead magnets we could make for our target audience. I will describe the product or service we sell and provide a description of who our target audience is; based on that information, I want you to generate lead magnet ideas that we could build for our target audience. The goal of these lead magnets is to captivate our target audience's interest by giving them something of value in exchange for their information, hopefully lowering our businesses' customer acquisition cost, or CAC.

Business Context:
Product/service: ${prodDescription}
Target audience: ${targetAudience}
Location: ${location || 'Not specified'}

Requirements:
Generate 7-10 web app ideas that:
- Solve a real problem the target audience faces
- Naturally lead to my paid services
- Can collect email addresses/contact info

For each idea, provide:
- Lead Magnet Name: creative, but self-explanatory
- Summary: what it is in 1-2 sentences
- Detailed Description: a more detailed explainer of the lead magnet, 4-6 sentences long
- Value Proposition: why would the target audience use this
- Lead Connection: how it connects to your product/service
- Creation Prompt: A somewhat simple prompt I can give an AI to build out a prototype of this lead magnet
- Complexity Level: Simple/Moderate/Advanced

Make sure to include at least 1 idea for each complexity level.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, summary, detailedDescription, valueProposition, leadConnection, creationPrompt, complexityLevel.`;

      const response = await client.responses.create({
        model: "o4-mini", // Using o3 model as requested by user
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

      console.log("Response from OpenAI:", response)
      const rawOutputText = response.output_text;
      const result = JSON.parse(rawOutputText || "{}");
      
      if (!result.ideas || !Array.isArray(result.ideas)) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Validate each idea has required properties
      const validatedIdeas: LeadMagnetIdea[] = result.ideas.map((idea: any) => ({
        name: idea.name || "Unnamed Idea",
        summary: idea.summary || "No summary provided",
        detailedDescription: idea.detailedDescription || "No description provided",
        valueProposition: idea.valueProposition || "No value proposition specified",
        leadConnection: idea.leadConnection || "No lead connection specified",
        creationPrompt: idea.creationPrompt || "No creation prompt provided",
        complexityLevel: idea.complexityLevel || "Simple"
      }));

      // Save request to storage
      await storage.saveLeadMagnetRequest({
        prodDescription,
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
