import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import * as schema from "@shared/schema";
import { 
  magnetRequests, 
  ideas,
  helpRequests,
  type MagnetRequest, 
  type Idea,
  type HelpRequest,
  type InsertMagnetRequest, 
  type InsertIdea,
  type InsertHelpRequest
} from "@shared/schema";

// Initialize database connection
const connectionString = process.env.SUPA_PWD 
  ? `postgresql://postgres.kbrieyaleukoqavqcslc:${process.env.SUPA_PWD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  : '';

if (!connectionString) {
  throw new Error('SUPA_PWD environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  createMagnetRequest(request: InsertMagnetRequest): Promise<MagnetRequest>;
  createIdeas(ideasData: InsertIdea[]): Promise<Idea[]>;
  getMagnetRequestByPublicId(publicId: string): Promise<MagnetRequest & { ideas: Idea[] } | null>;
  getIdeaById(id: number): Promise<Idea & { magnetRequest: MagnetRequest } | null>;
  updateIdea(id: number, updates: Partial<Pick<Idea, 'creationPrompt' | 'magnetSpec'>>): Promise<Idea | null>;
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    // Placeholder for user functionality
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // Placeholder for user functionality
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // Placeholder for user functionality
    return insertUser;
  }



  async createMagnetRequest(request: InsertMagnetRequest): Promise<MagnetRequest> {
    const publicId = nanoid(12); // Generate a 12-character random ID
    
    const [savedRequest] = await db.insert(magnetRequests).values({
      ...request,
      publicId,
      location: request.location || null
    }).returning();
    
    return savedRequest;
  }

  async createIdeas(ideasData: InsertIdea[]): Promise<Idea[]> {
    if (ideasData.length === 0) return [];
    
    const savedIdeas = await db.insert(ideas).values(ideasData).returning();
    return savedIdeas;
  }

  async getMagnetRequestByPublicId(publicId: string): Promise<MagnetRequest & { ideas: Idea[] } | null> {
    const request = await db.query.magnetRequests.findFirst({
      where: (magnetRequests, { eq }) => eq(magnetRequests.publicId, publicId),
      with: {
        ideas: true
      }
    });
    
    return request || null;
  }

  async getIdeaById(id: number): Promise<Idea & { magnetRequest: MagnetRequest } | null> {
    const idea = await db.query.ideas.findFirst({
      where: (ideas, { eq }) => eq(ideas.id, id),
      with: {
        magnetRequest: true
      }
    });
    
    return idea || null;
  }

  async updateIdea(id: number, updates: Partial<Pick<Idea, 'creationPrompt' | 'magnetSpec'>>): Promise<Idea | null> {
    const [updatedIdea] = await db.update(ideas)
      .set(updates)
      .where(eq(ideas.id, id))
      .returning();
    
    return updatedIdea || null;
  }

  async createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest> {
    const [savedRequest] = await db.insert(helpRequests).values(request).returning();
    return savedRequest;
  }
}



// Use Supabase storage by default
export const storage = new SupabaseStorage();
