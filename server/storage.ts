import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import * as schema from "@shared/schema";
import { 
  magnetRequests, 
  ideas,
  ideaIterations,
  helpRequests,
  ideaFeedback,
  type MagnetRequest, 
  type Idea,
  type IdeaIteration,
  type HelpRequest,
  type IdeaFeedback,
  type InsertMagnetRequest, 
  type InsertIdea,
  type InsertIdeaIteration,
  type InsertHelpRequest,
  type InsertIdeaFeedback
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
  createIdeaIterations(iterationsData: InsertIdeaIteration[]): Promise<IdeaIteration[]>;
  getMagnetRequestByPublicId(publicId: string): Promise<MagnetRequest & { ideas: (Idea & { iterations: IdeaIteration[] })[] } | null>;
  getIdeaById(id: number): Promise<Idea & { magnetRequest: MagnetRequest } | null>;
  getIdeaByResultId(publicId: string, resultIdeaId: number): Promise<Idea & { magnetRequest: MagnetRequest } | null>;
  getIdeaByIdAndVersion(id: number, version: number): Promise<IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } } | null>;
  getIdeaIterationsByIdeaId(ideaId: number): Promise<(IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } })[]>;
  getIterationMetadataByIdeaId(ideaId: number): Promise<{ id: number; version: number }[]>;
  getIdeaIterationById(id: number): Promise<IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } } | null>;
  updateIdeaIteration(id: number, updates: Partial<Omit<IdeaIteration, 'id' | 'ideaId' | 'createdAt'>>): Promise<IdeaIteration | null>;
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
  getHelpRequestWithIteration(id: number): Promise<any>;
  createIdeaFeedback(request: InsertIdeaFeedback): Promise<IdeaFeedback>;
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
      location: request.location || null,
      businessUrl: request.businessUrl
    }).returning();
    
    return savedRequest;
  }

  async createIdeas(ideasData: InsertIdea[]): Promise<Idea[]> {
    if (ideasData.length === 0) return [];
    
    const savedIdeas = await db.insert(ideas).values(ideasData).returning();
    return savedIdeas;
  }

  async createIdeaIterations(iterationsData: InsertIdeaIteration[]): Promise<IdeaIteration[]> {
    if (iterationsData.length === 0) return [];
    
    const savedIterations = await db.insert(ideaIterations).values(iterationsData).returning();
    return savedIterations;
  }

  async getMagnetRequestByPublicId(publicId: string): Promise<MagnetRequest & { ideas: (Idea & { iterations: IdeaIteration[] })[] } | null> {
    const request = await db.query.magnetRequests.findFirst({
      where: (magnetRequests, { eq }) => eq(magnetRequests.publicId, publicId),
      with: {
        ideas: {
          with: {
            iterations: {
              orderBy: (iterations, { desc }) => [desc(iterations.version)]
            }
          }
        }
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

  async getIdeaByResultId(publicId: string, resultIdeaId: number): Promise<Idea & { magnetRequest: MagnetRequest } | null> {
    // First get the magnet request by public ID
    const magnetRequest = await db.query.magnetRequests.findFirst({
      where: (magnetRequests, { eq }) => eq(magnetRequests.publicId, publicId)
    });
    
    if (!magnetRequest) {
      return null;
    }
    
    // Then get the idea by result ID and magnet request ID
    const idea = await db.query.ideas.findFirst({
      where: (ideas, { and, eq }) => and(
        eq(ideas.resultIdeaId, resultIdeaId),
        eq(ideas.magnetRequestId, magnetRequest.id)
      ),
      with: {
        magnetRequest: true
      }
    });
    
    return idea || null;
  }

  async getIdeaByIdAndVersion(id: number, version: number): Promise<IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } } | null> {
    const iteration = await db.query.ideaIterations.findFirst({
      where: (ideaIterations, { and, eq }) => and(eq(ideaIterations.ideaId, id), eq(ideaIterations.version, version)),
      with: {
        idea: {
          with: {
            magnetRequest: true
          }
        }
      }
    });
    
    return iteration || null;
  }

  async getIdeaIterationsByIdeaId(ideaId: number): Promise<(IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } })[]> {
    const iterations = await db.query.ideaIterations.findMany({
      where: (ideaIterations, { eq }) => eq(ideaIterations.ideaId, ideaId),
      orderBy: (ideaIterations, { asc }) => [asc(ideaIterations.version)],
      with: {
        idea: {
          with: {
            magnetRequest: true
          }
        }
      }
    });
    
    return iterations;
  }

  async getIterationMetadataByIdeaId(ideaId: number): Promise<{ id: number; version: number }[]> {
    const iterations = await db.select({
      id: ideaIterations.id,
      version: ideaIterations.version,
    })
    .from(ideaIterations)
    .where(eq(ideaIterations.ideaId, ideaId))
    .orderBy(ideaIterations.version);
    
    return iterations;
  }

  async getIdeaIterationById(id: number): Promise<IdeaIteration & { idea: Idea & { magnetRequest: MagnetRequest } } | null> {
    const iteration = await db.query.ideaIterations.findFirst({
      where: (ideaIterations, { eq }) => eq(ideaIterations.id, id),
      with: {
        idea: {
          with: {
            magnetRequest: true
          }
        }
      }
    });
    
    return iteration || null;
  }

  async updateIdeaIteration(id: number, updates: Partial<Omit<IdeaIteration, 'id' | 'ideaId' | 'createdAt'>>): Promise<IdeaIteration | null> {
    const [updatedIteration] = await db.update(ideaIterations)
      .set(updates)
      .where(eq(ideaIterations.id, id))
      .returning();
    
    return updatedIteration || null;
  }

  async createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest> {
    const [savedRequest] = await db.insert(helpRequests).values(request).returning();
    return savedRequest;
  }

  async getHelpRequestWithIteration(id: number): Promise<any> {
    const helpRequest = await db.query.helpRequests.findFirst({
      where: (helpRequests, { eq }) => eq(helpRequests.id, id),
      with: {
        ideaIteration: {
          with: {
            idea: {
              with: {
                magnetRequest: true
              }
            }
          }
        }
      }
    });
    
    return helpRequest || null;
  }

  async createIdeaFeedback(request: InsertIdeaFeedback): Promise<IdeaFeedback> {
    const [savedFeedback] = await db.insert(ideaFeedback).values(request).returning();
    return savedFeedback;
  }
}



// Use Supabase storage by default
export const storage = new SupabaseStorage();
