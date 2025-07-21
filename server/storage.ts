import { leadMagnetRequests, type LeadMagnetRequest, type InsertLeadMagnetRequest } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  saveLeadMagnetRequest(request: InsertLeadMagnetRequest & { ideas: any }): Promise<LeadMagnetRequest>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private leadMagnetRequests: Map<number, LeadMagnetRequest>;
  currentId: number;
  currentRequestId: number;

  constructor() {
    this.users = new Map();
    this.leadMagnetRequests = new Map();
    this.currentId = 1;
    this.currentRequestId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentId++;
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveLeadMagnetRequest(request: InsertLeadMagnetRequest & { ideas: any }): Promise<LeadMagnetRequest> {
    const id = this.currentRequestId++;
    const savedRequest: LeadMagnetRequest = { 
      ...request, 
      id,
      location: request.location || null
    };
    this.leadMagnetRequests.set(id, savedRequest);
    return savedRequest;
  }
}

export const storage = new MemStorage();
