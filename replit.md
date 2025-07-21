# Lead Magnet Idea Generator

## Overview

This is a full-stack web application that generates AI-powered lead magnet ideas for businesses. Users input their business type, target audience, and location, and the application generates creative web app ideas that can serve as lead magnets to capture potential customers' contact information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **AI Integration**: OpenAI API (using o3-mini model) for idea generation
- **Build Tool**: esbuild for server-side bundling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migrations**: Drizzle Kit for schema management
- **Development Storage**: In-memory storage for development/testing

## Key Components

### Shared Schema (`shared/schema.ts`)
- Centralized data models and validation schemas using Zod
- Database table definitions using Drizzle ORM
- TypeScript type inference for type safety across frontend and backend

### Frontend Components
- **Form Handling**: Business information input with validation
- **Idea Display**: Card-based layout showing generated ideas with complexity badges
- **Modal System**: Edit functionality for updating business information
- **UI Components**: Comprehensive shadcn/ui component library

### Backend Services
- **Route Handlers**: Express.js routes for API endpoints
- **Storage Layer**: Abstracted storage interface supporting both in-memory and database storage
- **AI Service**: OpenAI integration for generating creative lead magnet ideas

## Data Flow

1. **User Input**: User fills out business information form (business type, target audience, location)
2. **Validation**: Frontend validates input using Zod schemas
3. **API Request**: Form data sent to `/api/generate-ideas` endpoint
4. **AI Processing**: Backend constructs prompt and sends request to OpenAI API
5. **Response Processing**: AI response parsed and validated
6. **Storage**: Request and ideas saved to database (or memory in development)
7. **UI Update**: Frontend displays generated ideas in card layout with edit capabilities

## External Dependencies

### AI Service
- **OpenAI API**: Primary AI service for generating lead magnet ideas
- **Model**: o3-mini for cost-effective and fast responses
- **Fallback**: Configurable API key environment variables

### Database
- **Neon Database**: Serverless PostgreSQL for production
- **Connection**: Environment variable-based configuration
- **Migration Strategy**: Drizzle Kit for schema management

### UI Framework
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Icon library for consistent iconography

## Deployment Strategy

### Development
- **Hot Module Replacement**: Vite dev server with Express.js integration
- **Environment**: NODE_ENV=development with in-memory storage
- **Scripts**: `npm run dev` for development server

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: esbuild bundling server code for Node.js runtime
- **Output**: `dist/` directory with both client and server builds
- **Scripts**: `npm run build` followed by `npm start`

### Environment Configuration
- **Database**: `DATABASE_URL` environment variable for PostgreSQL connection
- **AI Service**: `OPENAI_API_KEY` for OpenAI API access
- **Deployment**: Designed for containerized deployment with environment-based configuration

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared types and schemas for better type safety
2. **TypeScript First**: Full TypeScript implementation for both frontend and backend
3. **Schema-Driven Development**: Centralized Zod schemas ensure data consistency
4. **Component-Based UI**: Modular, reusable components with shadcn/ui design system
5. **Serverless-Ready**: Database and architecture designed for serverless deployment
6. **Development Experience**: Hot reloading, type checking, and comprehensive tooling