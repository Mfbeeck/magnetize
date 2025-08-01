import 'dotenv/config';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateIdeasSchema, insertHelpRequestSchema, insertIdeaFeedbackSchema, type LeadMagnetIdea } from "@shared/schema";
import OpenAI from "openai";
import { Resend } from 'resend';

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/generate-ideas", async (req, res) => {
    try {
      const validatedData = generateIdeasSchema.parse(req.body);
      const { prodDescription, targetAudience, location, businessUrl } = validatedData;

      const prompt = `You are a marketing guru and I need some advice from you. I am the CMO of a business and need help generating ideas for free web app lead magnets we could make for our target audience. I will describe the product or service we sell and provide a description of who our target audience is; based on that information, I want you to generate lead magnet ideas that we could build for our target audience by leveraging AI coding tools (so only suggest ideas that aren't extremely complex to build). I am not that well-versed in what is possible now with AI, so please make sure to add in interesting uses of AI in the lead magnet ideas when relevant. The goal of these lead magnets is to captivate our target audience's interest by giving them something of value in exchange for their information, hopefully lowering our businesses' customer acquisition cost, or CAC.

Business Context:
Product/service: ${prodDescription}
Target audience: ${targetAudience}
Location of customers: ${location || 'Not specified'}

Requirements:
Generate 7-10 web app ideas that:
- Solve a real problem the target audience faces
- Naturally lead to my paid services
- Can collect email addresses or other contact info

For each idea, make sure to:
- Use plain English. Avoid technical jargon (SDK, LLM, computer vision, etc.).
- Focus on the user experience: what they do and what they get.
- If a technical details are useful, try to describe them in user-focused terms such as “the app analyses your video” or “the tool automatically reviews your answers”.

For each idea, provide:
- Lead Magnet Name: creative, but self-explanatory
- Summary: what it is in 1-2 sentences
- Detailed Description: a detailed explainer of the lead magnet. This should be 6-12 sentences long and use simple language to explain the lead magnet to a non-technical person. It should cover what the lead magnet does, what input is required from the user and what output is delivered to the user. Also it should estimate how long it would take for a user to complete and specify what contact info the user would provide and when.
- Why This: A non-technical explanation of why this lead magnet makes sense specifically for the business being analyzed. This should be 5-10 sentences and explain why the business' target audience would find this valuable and how it relates to that business' product or service offering.
- Complexity Level: Simple/Moderate/Advanced (where simple is something that can be built in a few hours, moderate is something that can be built in a few days, and advanced is something that can be built in a few weeks)

Since I am just getting started on building these kinds of tools, focus on giving me mostly simple ideas with a few moderate ideas and include only 1 advanced idea.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, summary, detailedDescription, whyThis, complexityLevel.`;

      const response = await client.responses.create({
        model: "o3", // Using o3 model as requested by user
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

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
        businessUrl: businessUrl
      });

      // Save ideas to database with sequential result_idea_id values
      const ideasToSave = validatedIdeas.map((idea, index) => ({
        magnetRequestId: magnetRequest.id,
        resultIdeaId: index + 1, // Sequential ID starting from 1
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      const savedIdeas = await storage.createIdeas(ideasToSave);

      // Create initial iterations (version 0) for each idea
      const iterationsToSave = savedIdeas.map(idea => ({
        ideaId: idea.id,
        version: 0,
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      await storage.createIdeaIterations(iterationsToSave);

      // Add IDs to the ideas for the response
      const ideasWithIds = validatedIdeas.map((idea, index) => ({
        ...idea,
        id: savedIdeas[index]?.id,
        resultIdeaId: savedIdeas[index]?.resultIdeaId
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

  app.get("/api/results/:publicId/ideas/:resultIdeaId", async (req, res) => {
    try {
      const { publicId, resultIdeaId } = req.params;
      const resultId = parseInt(resultIdeaId);
      
      if (isNaN(resultId)) {
        return res.status(400).json({ 
          error: "Invalid result idea ID", 
          message: "Result idea ID must be a number" 
        });
      }

      const idea = await storage.getIdeaByResultId(publicId, resultId);
      
      if (!idea) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea not found" 
        });
      }

      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea by result ID:", error);
      res.status(500).json({ 
        error: "Failed to fetch idea", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/results/:publicId/ideas/:resultIdeaId/with-metadata", async (req, res) => {
    try {
      const { publicId, resultIdeaId } = req.params;
      const resultId = parseInt(resultIdeaId);
      
      if (isNaN(resultId)) {
        return res.status(400).json({ 
          error: "Invalid result idea ID", 
          message: "Result idea ID must be a number" 
        });
      }

      const idea = await storage.getIdeaByResultId(publicId, resultId);
      
      if (!idea) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea not found" 
        });
      }

      // Get iteration metadata for this idea
      const iterationMetadata = await storage.getIterationMetadataByIdeaId(idea.id);

      res.json({
        idea,
        iterationMetadata
      });
    } catch (error) {
      console.error("Error fetching idea with metadata:", error);
      res.status(500).json({ 
        error: "Failed to fetch idea with metadata", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });





  app.post("/api/generate-spec", async (req, res) => {
    try {
      const { idea, businessData, iterationId } = req.body;
      
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
Contact collection needs: Email or other contact info

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
- Brief description of the business (name, product/service, target audience, location - if not specified, don't include) the lead magnet is for
- Clear project description and requirements
- Specific functionality details explaining what the app should do and how it should work
- UI/UX specifications
- Output format requirements

The one-shot coding prompt should be detailed enough that an AI tool can build a working prototype, but there's no need to detail out the technical implementation details, the AI builder can decide how to implement it.

Output Format:
Return as a JSON object with two properties: "magnetSpec" (containing the technical specification) and "creationPrompt" (containing the one-shot coding prompt).`;

      const response = await client.responses.create({
        model: "o3",
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

      const rawOutputText = response.output_text;
      const result = JSON.parse(rawOutputText || "{}");
      
      if (!result.magnetSpec || !result.creationPrompt) {
        throw new Error("Invalid response format from OpenAI for spec generation");
      }

      // Update the idea iteration in the database if iterationId is provided
      if (iterationId) {
        console.log('Updating iteration with ID:', iterationId);
        console.log('Creation prompt length:', result.creationPrompt?.length);
        console.log('Magnet spec length:', result.magnetSpec?.length);
        
        // First, let's check if the iteration exists
        const existingIteration = await storage.getIdeaIterationById(iterationId);
        console.log('Existing iteration found:', !!existingIteration);
        if (existingIteration) {
          console.log('Existing iteration version:', existingIteration.version);
          console.log('Existing iteration has creationPrompt:', !!existingIteration.creationPrompt);
          console.log('Existing iteration has magnetSpec:', !!existingIteration.magnetSpec);
        }
        
        const updatedIteration = await storage.updateIdeaIteration(iterationId, {
          creationPrompt: result.creationPrompt,
          magnetSpec: result.magnetSpec
        });
        
        console.log('Update result:', updatedIteration ? 'success' : 'failed');
        if (updatedIteration) {
          console.log('Updated iteration has creationPrompt:', !!updatedIteration.creationPrompt);
          console.log('Updated iteration has magnetSpec:', !!updatedIteration.magnetSpec);
        }
        
        // Let's verify the update by fetching the iteration again
        const verifyIteration = await storage.getIdeaIterationById(iterationId);
        console.log('Verification - iteration has creationPrompt:', !!verifyIteration?.creationPrompt);
        console.log('Verification - iteration has magnetSpec:', !!verifyIteration?.magnetSpec);
      } else {
        console.log('No iterationId provided, skipping database update');
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
      const { prodDescription, targetAudience, location, businessUrl } = validatedData;

      const prompt = `You are a marketing guru and I need some advice from you. I am the CMO of a business and need help generating ideas for free web app lead magnets we could make for our target audience. I will describe the product or service we sell and provide a description of who our target audience is; based on that information, I want you to generate lead magnet ideas that we could build for our target audience by leveraging AI coding tools (so only suggest ideas that aren't extremely complex to build). I am not that well-versed in what is possible now with AI, so please make sure to add in interesting uses of AI in the lead magnet ideas when relevant. The goal of these lead magnets is to captivate our target audience's interest by giving them something of value in exchange for their information, hopefully lowering our businesses' customer acquisition cost, or CAC.

Business Context:
Product/service: ${prodDescription}
Target audience: ${targetAudience}
Location of customers: ${location || 'Not specified'}

Requirements:
Generate 7-10 web app ideas that:
- Solve a real problem the target audience faces
- Naturally lead to my paid services
- Can collect email addresses or other contact info

For each idea, make sure to:
- Use plain English. Avoid technical jargon (SDK, LLM, computer vision, etc.).
- Focus on the user experience: what they do and what they get.
- If a technical details are useful, try to describe them in user-focused terms such as “the app analyses your video” or “the tool automatically reviews your answers”.

For each idea, provide:
- Lead Magnet Name: creative, but self-explanatory
- Summary: what it is in 1-2 sentences
- Detailed Description: a detailed explainer of the lead magnet. This should be 6-12 sentences long and use simple language to explain the lead magnet to a non-technical person. It should cover what the lead magnet does, what input is required from the user and what output is delivered to the user. It should also estimate how long it would take for a user to complete and specify what contact info the user would provide and when.
- Why This: A non-technical explanation of why this lead magnet makes sense specifically for the business being analyzed. This should be 5-10 sentences and explain why the business' target audience would find this valuable and how it relates to that business' product or service offering.
- Complexity Level: Simple/Moderate/Advanced (where simple is something that can be built in a few hours, moderate is something that can be built in a few days, and advanced is something that can be built in a few weeks)

Since I am just getting started on building these kinds of tools, focus on giving me mostly simple ideas with a few moderate ideas and include only 1 advanced idea.

Output Format:
Return as a dictionary in json format with an "ideas" array containing all ideas and their respective properties. Each idea should have the exact properties: name, summary, detailedDescription, whyThis, complexityLevel.`;

      const response = await client.responses.create({
        model: "o3",
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

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
        complexityLevel: idea.complexityLevel || "Simple"
      }));

      // Save request to database using new schema
      const magnetRequest = await storage.createMagnetRequest({
        prodDescription,
        targetAudience,
        location: location || null,
        businessUrl
      });

      // Save ideas to database with sequential result_idea_id values
      const ideasToSave = validatedIdeas.map((idea, index) => ({
        magnetRequestId: magnetRequest.id,
        resultIdeaId: index + 1, // Sequential ID starting from 1
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      const savedIdeas = await storage.createIdeas(ideasToSave);

      // Create initial iterations (version 0) for each idea
      const iterationsToSave = savedIdeas.map(idea => ({
        ideaId: idea.id,
        version: 0,
        name: idea.name,
        summary: idea.summary,
        detailedDescription: idea.detailedDescription,
        whyThis: idea.whyThis,
        complexityLevel: idea.complexityLevel
      }));

      await storage.createIdeaIterations(iterationsToSave);

      // Add IDs to the ideas for the response
      const ideasWithIds = validatedIdeas.map((idea, index) => ({
        ...idea,
        id: savedIdeas[index]?.id,
        resultIdeaId: savedIdeas[index]?.resultIdeaId
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
      const { ideaId, ideaIterationId, email } = validatedData;

      // Verify the idea iteration exists if provided, otherwise verify the idea exists
      let iteration = null;
      let idea = null;
      
      if (ideaIterationId) {
        iteration = await storage.getIdeaIterationById(ideaIterationId);
        if (!iteration) {
          return res.status(404).json({ 
            error: "Not found", 
            message: "Idea iteration not found" 
          });
        }
        idea = iteration.idea;
      } else if (ideaId) {
        idea = await storage.getIdeaById(ideaId);
        if (!idea) {
          return res.status(404).json({ 
            error: "Not found", 
            message: "Idea not found" 
          });
        }
      } else {
        return res.status(400).json({ 
          error: "Bad request", 
          message: "Either ideaId or ideaIterationId must be provided" 
        });
      }

      // Create the help request
      const helpRequest = await storage.createHelpRequest({
        ideaId: ideaId || (iteration ? iteration.ideaId : null),
        ideaIterationId: ideaIterationId || null,
        email
      });

      // Send email notification
      try {
        if (!resend) {
          console.warn("Resend API key not configured, skipping email send");
          return;
        }

        // Extract domain name from business URL
        let domainName = "Magnetize";
        try {
          // Normalize URL - add https:// if no protocol is specified
          const normalizeUrl = (url: string): string => {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              return `https://${url}`;
            }
            return url;
          };
          
          const normalizedUrl = normalizeUrl(idea.magnetRequest.businessUrl);
          const businessUrl = new URL(normalizedUrl);
          domainName = businessUrl.hostname.replace('www.', '');
        } catch (error) {
          console.warn("Could not parse business URL for domain extraction:", error);
        }

        // Get the idea name and construct URL based on whether we have an iteration or not
        const ideaName = iteration ? iteration.name : idea.name;
        const ideaUrl = iteration 
          ? `${req.protocol}://${req.get('host')}/results/${idea.magnetRequest.publicId}/ideas/${idea.resultIdeaId}/v/${iteration.version}`
          : `${req.protocol}://${req.get('host')}/results/${idea.magnetRequest.publicId}/ideas/${idea.resultIdeaId}`;

        // Send email using Resend
        await resend.emails.send({
          from: 'Magnetize Team <team@mbuild-software.com>',
          to: [email],
          cc: ['team@mbuild-software.com'],
          bcc: ['mfbeeck@gmail.com'],
          subject: `We got your request, let's explore your ${ideaName} lead magnet!`,
          text: `Hey there,

Thanks for reaching out about the "${ideaName}" idea for ${domainName}.

We love building value-first tools like this and are eager to discuss how we can help you bring it to life.

What happens next

1. 15-30 min chat – within the next 48 hours we'll email you to schedule a quick call where we'll explore the project, clarify outcomes, and decide how we can best help.

2. Scope & timeline – if it's a fit, we'll follow up with a short proposal outlining deliverables, schedule, and investment.

3. Build & launch – if you're happy with the plan, we'll get rolling and keep you updated at every milestone.

Meanwhile, you can review your idea details here: ${ideaUrl}

Talk soon!

Best,
Matias + the Magnetize team
https://leadmagnet.build`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0; padding: 20px; color: #333; line-height: 1.6; font-size: 14px;">
              <p style="margin-bottom: 20px;">
                Hey there,
              </p>
              
              <p style="margin-bottom: 20px;">
                Thanks for reaching out about the "${ideaName}" idea for ${domainName}.
              </p>
              
              <p style="margin-bottom: 20px;">
                We love building value-first tools like this and are eager to discuss how we can help you bring it to life.
              </p>
              
              <p style="margin: 30px 0 15px 0; font-weight: bold;">What happens next</p>
              
              <p style="margin-bottom: 15px;">
                1. <strong>15-30 min chat</strong> – within the next 48 hours we'll email you to schedule a quick call where we'll explore the project, clarify outcomes, and decide how we can best help.
              </p>
              
              <p style="margin-bottom: 15px;">
                2. <strong>Scope & timeline</strong> – if it's a fit, we'll follow up with a short proposal outlining deliverables, schedule, and investment.
              </p>
              
              <p style="margin-bottom: 20px;">
                3. <strong>Build & launch</strong> – if you're happy with the plan, we'll get rolling and keep you updated at every milestone.
              </p>
              
              <p style="margin-bottom: 20px;">
                Meanwhile, you can review your idea details here: <a href="${ideaUrl}" style="color: #0066cc;">${ideaName}</a>.
              </p>
              
              <p style="margin-bottom: 20px;">
                Talk soon!
              </p>
              
              <p style="margin-bottom: 20px;">
                Best,<br>
                Matias + the Magnetize team<br>
                <a href="https://leadmagnet.build" style="color: #0066cc;">leadmagnet.build</a>
              </p>
            </div>
          `
        });

      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails, just log the error
      }

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

  app.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertIdeaFeedbackSchema.parse(req.body);
      const { ideaIterationId, feedbackRating, feedbackComments } = validatedData;

      // Verify the idea iteration exists
      const iteration = await storage.getIdeaIterationById(ideaIterationId);
      if (!iteration) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea iteration not found" 
        });
      }

      // Create the feedback
      const feedback = await storage.createIdeaFeedback({
        ideaIterationId,
        feedbackRating,
        feedbackComments: feedbackComments || null
      });

      res.json({ 
        success: true,
        feedback
      });
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ 
        error: "Failed to create feedback", 
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

      // Normalize URL - add https:// if no protocol is specified
      const normalizeUrl = (url: string): string => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
        }
        return url;
      };

      const normalizedUrl = normalizeUrl(businessUrl);
      const prompt = `You are a senior marketing strategist with strong web‑research skills.

Task
1. Visit and read the content from the following business website: ${normalizedUrl}.
2. Based only on content from that website (no other sources), write:  
   • prodDescription – 1‑4 concise sentences explaining the core product or service.  
   • targetAudience – 1‑4 concise sentences describing the likely customers, inferred from the site's messaging.  
   • confidence – an integer 1‑10 reflecting how certain you are about what the business does and who their target audience is (10 = very certain; 1 = no clear idea).

Output  
Return ONLY a valid JSON object with no markdown formatting, no code blocks, no commentary, and no extra keys:

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
- Return ONLY the raw JSON object, no markdown formatting, no code blocks, no additional text.
- Do not wrap the JSON in backticks or any other formatting.`;
      // Use OpenAI o4-mini with web_search_preview tool
      const response = await client.responses.create({
        model: "gpt-4.1",
        input: prompt,
        tools: [{ type: "web_search_preview" }]
      });
      const rawOutputText = response.output_text;
      
      // Extract JSON from the response, handling both pure JSON and markdown-formatted JSON
      let result;
      try {
        // First try to parse as pure JSON
        result = JSON.parse(rawOutputText || "{}");
      } catch (parseError) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = rawOutputText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[1]);
          } catch (markdownParseError) {
            console.error("Failed to parse JSON from markdown:", markdownParseError);
            throw new Error("AI returned invalid JSON format");
          }
        } else {
          console.error("No valid JSON found in response:", rawOutputText);
          throw new Error("AI did not return valid JSON");
        }
      }
      if (!result.prodDescription || !result.targetAudience) {
        throw new Error("AI did not return expected fields");
      }
      res.json({
        prodDescription: result.prodDescription,
        targetAudience: result.targetAudience,
        confidence: result.confidence,
        website: normalizedUrl
      });
    } catch (error) {
      console.error("Error in autofill-business-profile:", error);
      res.status(500).json({
        error: "Failed to autofill business profile",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/iterate-idea", async (req, res) => {
    try {
      const { ideaId, userFeedback, currentIdeaContent } = req.body;
      
      if (!ideaId || !userFeedback) {
        return res.status(400).json({ 
          error: "Missing required data", 
          message: "Idea ID and user feedback are required" 
        });
      }

      // Get the current idea with its magnet request data
      const idea = await storage.getIdeaById(ideaId);
      if (!idea) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea not found" 
        });
      }

      // Get the latest iteration to use as the base
      const iterations = await storage.getIdeaIterationsByIdeaId(ideaId);
      const latestIteration = iterations[iterations.length - 1];
      if (!latestIteration) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea iteration not found" 
        });
      }

      // Use currentIdeaContent if provided, otherwise use latest iteration
      const baseContent = currentIdeaContent || latestIteration;

      const prompt = `You are the marketing expert who came up with an impactful lead magnet idea for the business mentioned below. I want you to improve upon the lead magnet idea you came up with based on the user's feedback.

Goal  
Use the user's feedback to iterate on the provided lead magnet idea, producing a sharper, more personalized version.

Inputs  
Business Context (unchanged):  
• Product/service: ${idea.magnetRequest.prodDescription}  
• Target audience: ${idea.magnetRequest.targetAudience}  
• Location: ${idea.magnetRequest.location || 'Not specified'}

Original lead magnet idea provided:  
• Lead magnet name: "${baseContent.name}",
• Summary of lead magnet: "${baseContent.summary}",
• Detailed description of lead magnet: "${baseContent.detailedDescription}",
• Why this lead magnet makes sense for the business: "${baseContent.whyThis}",
• Complexity level of building the lead magnet (simple, moderate or advanced, where simple is something that can be built in a few hours, moderate is something that can be built in a few days, and advanced is something that can be built in a few weeks): "${baseContent.complexityLevel}"

User feedback / personalization notes (free‑form text):  
${userFeedback}

Instructions  
1. Re‑read the above **Business Context** and the **Original lead magnet info** alongside the **User feedback**.  
2. Revise or iterate on the idea so it better fits the feedback while still:  
   • Solving a real problem for the target audience  
   • Naturally leading to the business' paid offering  
   • Collecting email addresses or contact info
3. Reassess the complexity level (Simple | Moderate | Advanced) based on the updated scope and note the new level in the output.  
4. Preserve the five fields exactly as named:  
   • name  
   • summary  
   • detailedDescription (4‑6 sentences)  
   • whyThis (3‑6 sentences explaining relevance and value)  
   • complexityLevel  

Output format  
Return a JSON object structured exactly like this:

{
  "name": "<string>",
  "summary": "<string>",
  "detailedDescription": "<string>",
  "whyThis": "<string>",
  "complexityLevel": "<Simple|Moderate|Advanced>"
}
`;

      const response = await client.responses.create({
        model: "o3",
        input: prompt,
        text: { 
          format: {
            type: "json_object" }
        }
      });

      const rawOutputText = response.output_text;
      const result = JSON.parse(rawOutputText || "{}");
      
      if (!result.name || !result.summary || !result.detailedDescription || !result.whyThis || !result.complexityLevel) {
        throw new Error("Invalid response format from OpenAI for idea iteration");
      }

      const newIdea = result;

      // Validate the new idea has required properties
      if (!newIdea.name || !newIdea.summary || !newIdea.detailedDescription || !newIdea.whyThis || !newIdea.complexityLevel) {
        throw new Error("Incomplete idea data returned from OpenAI");
      }

      // Create a new iteration of the idea
      const newIterationNumber = latestIteration.version + 1;
      
      const newIterationData = {
        ideaId: ideaId,
        version: newIterationNumber,
        name: newIdea.name,
        summary: newIdea.summary,
        detailedDescription: newIdea.detailedDescription,
        whyThis: newIdea.whyThis,
        complexityLevel: newIdea.complexityLevel,
        feedbackProvided: userFeedback
      };

      const [createdIteration] = await storage.createIdeaIterations([newIterationData]);
      
      // Get the created iteration with idea and magnet request data
      const updatedIteration = await storage.getIdeaByIdAndVersion(ideaId, newIterationNumber);

      res.json({ 
        success: true,
        idea: updatedIteration
      });
    } catch (error) {
      console.error("Error iterating idea:", error);
      res.status(500).json({ 
        error: "Failed to iterate idea", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/ideas/:id/iteration/:version", async (req, res) => {
    try {
      const { id, version } = req.params;
      const ideaId = parseInt(id);
      const versionNum = parseInt(version);
      
      if (isNaN(ideaId) || isNaN(versionNum)) {
        return res.status(400).json({ 
          error: "Invalid parameters", 
          message: "Idea ID and version must be numbers" 
        });
      }

      // Get the specific iteration
      const iteration = await storage.getIdeaByIdAndVersion(ideaId, versionNum);
      
      if (!iteration) {
        return res.status(404).json({ 
          error: "Not found", 
          message: "Idea iteration not found" 
        });
      }
      
      res.json({ iteration });
    } catch (error) {
      console.error("Error fetching idea iteration:", error);
      res.status(500).json({ 
        error: "Failed to fetch idea iteration", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
