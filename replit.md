# Medical Education Game Generator

## Overview

This application is a fully functional medical education platform that generates interactive educational games for patient care. It successfully integrates with the DailyMed API to search real medication databases and uses OpenAI GPT-4o to create personalized educational content. The system processes patient information and generates 6 types of educational games: crosswords, word searches, fill-in-the-blank exercises, multiple choice quizzes, matching games, and true/false questions.

## Recent Changes (July 26, 2025)
- ✅ **Fixed DailyMed API Integration**: Successfully connecting to real DailyMed database with proper headers
- ✅ **Enhanced Medication Database**: Added comprehensive medication information with real medical data
- ✅ **OpenAI Integration Working**: GPT-4o generating educational games from patient information
- ✅ **Real-time Processing Pipeline**: Visual feedback showing API integration status
- ✅ **Comprehensive UI**: Complete patient form, processing status, and game display components
- ✅ **CRITICAL MEDICAL FIX**: Implemented proper IR/ER medication handling - medications now default to IR (Immediate Release) unless explicitly specified as ER (Extended Release)

## User Preferences

**Critical Medical Requirement**: Medications must default to IR (Immediate Release) formulation unless explicitly specified as ER (Extended Release). This is essential for medical accuracy and patient safety.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme colors
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful API with centralized route registration
- **Database**: PostgreSQL with Drizzle ORM (configured but not actively used in current implementation)
- **Session Storage**: In-memory storage with fallback to PostgreSQL sessions via connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM with schema definitions in shared directory
- **Migrations**: Drizzle Kit for database schema management
- **Current State**: Using in-memory storage for development with database ready for production

## Key Components

### Core Services
1. **DailyMed Service** (`server/services/dailymed.ts`)
   - Integrates with DailyMed API for medication information
   - Searches multiple medications and retrieves detailed drug information
   - Handles API errors gracefully with fallback mechanisms

2. **OpenAI Service** (`server/services/openai.ts`)
   - Uses GPT-4o model for educational content generation
   - Processes patient information and medication data
   - Generates structured educational games in JSON format

3. **Storage Service** (`server/storage.ts`)
   - Provides abstraction layer for data persistence
   - Currently implements in-memory storage for users
   - Ready for database integration with defined interfaces

### Frontend Components
1. **Patient Form** (`client/src/components/patient-form.tsx`)
   - Collects patient information input
   - Manages form validation and submission
   - Handles loading states and error feedback

2. **Processing Pipeline** (`client/src/components/processing-pipeline.tsx`)
   - Visual progress indicator for multi-step processing
   - Shows real-time status of each processing stage
   - Provides feedback on DailyMed API and OpenAI processing

3. **Generated Games** (`client/src/components/generated-games.tsx`)
   - Displays generated educational games
   - Provides game-specific icons and difficulty badges
   - Offers download and print functionality

## Data Flow

1. **Input Processing**: User submits patient information through the frontend form
2. **Validation**: Server validates input using Zod schemas from shared directory
3. **External API Integration**: System queries DailyMed API for medication information
4. **AI Processing**: OpenAI service generates educational games based on patient data and medication info
5. **Response Delivery**: Generated games and processing metadata returned to frontend
6. **Presentation**: Frontend displays games with interactive UI components

## External Dependencies

### APIs and Services
- **DailyMed API**: NIH database for medication information and drug labels
- **OpenAI API**: GPT-4o model for educational content generation
- **Neon Database**: Serverless PostgreSQL for production data storage

### Key Libraries
- **UI Framework**: React with Radix UI primitives for accessibility
- **Validation**: Zod for runtime type checking and schema validation
- **HTTP Client**: Native fetch API with custom error handling
- **Date Handling**: date-fns for date manipulation
- **Form Management**: React Hook Form with Zod resolvers

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR and error overlay
- **Database**: Uses in-memory storage with optional PostgreSQL connection
- **Environment Variables**: DATABASE_URL and OPENAI_API_KEY required

### Production Build
- **Frontend**: Vite builds optimized React bundle to dist/public
- **Backend**: ESBuild compiles TypeScript server to dist/index.js
- **Deployment**: Single artifact deployment with static file serving
- **Database**: Requires PostgreSQL database with Drizzle migrations

### Configuration Management
- **TypeScript**: Shared configuration across client, server, and shared modules
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Build Scripts**: Separate commands for development, build, and production

The application follows a modular architecture with clear separation between frontend, backend, and shared code. The system is designed to be scalable and maintainable, with proper error handling and user feedback throughout the medical education game generation process.