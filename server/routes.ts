import 'dotenv/config';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateIdeasSchema, insertHelpRequestSchema, type LeadMagnetIdea } from "@shared/schema";
import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/generate-ideas", async (req, res) => {
    try {
      const validatedData = generateIdeasSchema.parse(req.body);
      const { prodDescription, targetAudience, location, businessUrl } = validatedData;

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
- Why This: Explain why this lead magnet makes sense for your business by describing the value it provides the audience and how it relates to what the business does. This should be 3-6 sentences that explain why the audience would find this valuable and how it relates to the business' products or services.
- Complexity Level: Simple/Moderate/Advanced

Make sure to include at least 1 idea for each complexity level.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, summary, detailedDescription, whyThis, complexityLevel.`;

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
        whyThis: idea.whyThis || "No explanation provided",
        creationPrompt: undefined, // Will be generated later
        magnetSpec: undefined, // Will be generated later
        complexityLevel: idea.complexityLevel || "Simple"
      }));

      // Save request to database using new schema
      const magnetRequest = await storage.createMagnetRequest({
        prodDescription,
        targetAudience,
        location: location || null,
        businessUrl: businessUrl || null
      });

      // Save ideas to database
      const ideasToSave = validatedIdeas.map(idea => ({
        magnetRequestId: magnetRequest.id,
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      const savedIdeas = await storage.createIdeas(ideasToSave);

      // Add IDs to the ideas for the response
      const ideasWithIds = validatedIdeas.map((idea, index) => ({
        ...idea,
        id: savedIdeas[index]?.id
      }));

      res.json({ 
        ideas: ideasWithIds,
        magnetRequestId: magnetRequest.id,
        publicId: magnetRequest.publicId
      });
    } catch (error) {
      console.error("Error generating ideas:", error);
      res.status(500).json({ 
        error: "Failed to generate ideas", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/results/:publicId", async (req, res) => {
    try {
      const { publicId } = req.params;
      
      const magnetRequest = await storage.getMagnetRequestByPublicId(publicId);
      
      if (!magnetRequest) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Magnet request not found" 
        });
      }

      res.json(magnetRequest);
    } catch (error) {
      console.error("Error fetching magnet request:", error);
      res.status(500).json({ 
        error: "Failed to fetch magnet request", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ideaId = parseInt(id);
      
      if (isNaN(ideaId)) {
        return res.status(400).json({ 
          error: "Invalid idea ID", 
          message: "Idea ID must be a number" 
        });
      }

      const idea = await storage.getIdeaById(ideaId);
      
      if (!idea) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea not found" 
        });
      }

      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ 
        error: "Failed to fetch idea", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/generate-spec", async (req, res) => {
    try {
      const { idea, businessData, ideaId } = req.body;
      
      if (!idea || !businessData) {
        return res.status(400).json({ 
          error: "Missing required data", 
          message: "Idea and business data are required" 
        });
      }

      const prompt = `You are a technical product manager who specializes in creating detailed specifications for AI-assisted web development. Your job is to take a web app concept and create both a comprehensive technical specification and a one-shot coding prompt.

App Concept: ${idea.summary}

${idea.detailedDescription}

${idea.whyThis}

Business Details:
Product/Service offering: ${businessData.prodDescription}
Target audience: ${businessData.targetAudience}
Location: ${businessData.location || 'Not specified'}
Contact collection needs: Email

Create two outputs:

OUTPUT 1: Technical Specification
Include:
- User experience flow (step-by-step journey)
- Required features and functionality
- Data collection requirements
- UI/UX considerations
- Third-party integrations needed
- Recommended tech stack
- Estimated development time phases

OUTPUT 2: One-Shot Coding Prompt
Create a complete, copy-paste prompt for AI coding tools that includes:
- Clear project description and requirements
- Specific functionality details
- UI/UX specifications
- Code structure preferences
- Output format requirements
- Any necessary constraints or limitations

The coding prompt should be detailed enough that an AI tool can build a working prototype without additional clarification.

Output Format:
Return as a JSON object with two properties: "magnetSpec" (containing the technical specification) and "creationPrompt" (containing the one-shot coding prompt).`;

      const response = await client.responses.create({
        model: "o4-mini",
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

      console.log("Response from OpenAI for spec generation:", response);
      const rawOutputText = response.output_text;
      const result = JSON.parse(rawOutputText || "{}");
      
      if (!result.magnetSpec || !result.creationPrompt) {
        throw new Error("Invalid response format from OpenAI for spec generation");
      }

      // Update the idea in the database if ideaId is provided
      if (ideaId) {
        await storage.updateIdea(ideaId, {
          creationPrompt: result.creationPrompt,
          magnetSpec: result.magnetSpec
        });
      }

      res.json({ 
        magnetSpec: result.magnetSpec,
        creationPrompt: result.creationPrompt
      });
    } catch (error) {
      console.error("Error generating spec:", error);
      res.status(500).json({ 
        error: "Failed to generate spec", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/regenerate-ideas", async (req, res) => {
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
- Why This: Explain why this lead magnet makes sense for your business by describing the value it provides the audience and how it relates to what the business does. This should be 3-6 sentences that explain why the audience would find this valuable and how it relates to the business' products or services.
- Complexity Level: Simple/Moderate/Advanced

Make sure to include at least 1 idea for each complexity level.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, summary, detailedDescription, whyThis, complexityLevel.`;

      const response = await client.responses.create({
        model: "o4-mini",
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
        whyThis: idea.whyThis || "No explanation provided",
        creationPrompt: undefined, // Will be generated later
        magnetSpec: undefined, // Will be generated later
        complexityLevel: idea.complexityLevel || "Simple"
      }));

      // Save request to database using new schema
      const magnetRequest = await storage.createMagnetRequest({
        prodDescription,
        targetAudience,
        location: location || null
      });

      // Save ideas to database
      const ideasToSave = validatedIdeas.map(idea => ({
        magnetRequestId: magnetRequest.id,
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      const savedIdeas = await storage.createIdeas(ideasToSave);

      // Add IDs to the ideas for the response
      const ideasWithIds = validatedIdeas.map((idea, index) => ({
        ...idea,
        id: savedIdeas[index]?.id
      }));

      res.json({ 
        ideas: ideasWithIds,
        magnetRequestId: magnetRequest.id,
        publicId: magnetRequest.publicId
      });
    } catch (error) {
      console.error("Error regenerating ideas:", error);
      res.status(500).json({ 
        error: "Failed to regenerate ideas", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/help-requests", async (req, res) => {
    try {
      const validatedData = insertHelpRequestSchema.parse(req.body);
      const { ideaId, email } = validatedData;

      // Verify the idea exists
      const idea = await storage.getIdeaById(ideaId);
      if (!idea) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea not found" 
        });
      }

      // Create the help request
      const helpRequest = await storage.createHelpRequest({
        ideaId,
        email
      });

      res.json({ 
        success: true,
        helpRequest
      });
    } catch (error) {
      console.error("Error creating help request:", error);
      res.status(500).json({ 
        error: "Failed to create help request", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/autofill-business-profile", async (req, res) => {
    try {
      const { businessUrl } = req.body;
      if (!businessUrl) {
        return res.status(400).json({ error: "Missing businessUrl" });
      }
      const prompt = `You are a senior marketing strategist with strong web‑research skills.

Task
1. Visit and read the content from the following business website: ${businessUrl}.
2. Based only on content from that website (no other sources), write:  
   • prodDescription – 1‑3 concise sentences explaining the core product or service.  
   • targetAudience – 1‑3 concise sentences describing the likely customers, inferred from the site's messaging.  
   • confidence – an integer 1‑10 reflecting how certain you are about what the business does and who their target audience is (10 = very certain; 1 = no clear idea).

Output  
Return **exactly** this JSON—no commentary, no extra keys:

{
  "website": "{{website_url}}",
  "prodDescription": "<your description>",
  "targetAudience": "<your description>",
  "confidence": <integer 1-10>
}

Guidelines  
- ONLY view the homepage page of the website, no need for citations.
- If the site is vague or confusing, lower the confidence score.  
- Keep language direct and free of marketing fluff.  
- Only return the JSON object, no other text or sources needed.`;
      // Use OpenAI o4-mini with web_search_preview tool
      const response = await client.responses.create({
        model: "gpt-4.1",
        input: prompt,
        tools: [{ type: "web_search_preview" }]
      });
      const rawOutputText = response.output_text;
      const result = JSON.parse(rawOutputText || "{}");
      if (!result.prodDescription || !result.targetAudience) {
        throw new Error("AI did not return expected fields");
      }
      res.json({
        prodDescription: result.prodDescription,
        targetAudience: result.targetAudience,
        confidence: result.confidence,
        website: result.website
      });
    } catch (error) {
      console.error("Error in autofill-business-profile:", error);
      res.status(500).json({
        error: "Failed to autofill business profile",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
