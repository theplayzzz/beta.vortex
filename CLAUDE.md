# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev:https` - Start HTTPS development server using `server-https.js`
- `npm run build` - Build application (includes Prisma generation and AI Guards compilation)
- `npm run lint` - Run ESLint for code quality
- `npm run test` - Run Jest test suite
- `npm run test:coverage` - Run tests with coverage report

### Database Operations
- `npx prisma generate` - Generate Prisma client (runs automatically on build/postinstall)
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database inspection
- `npm run apply-rls-policies` - Apply Row Level Security policies

### Production & Monitoring
- `npm run sync-invited-users` - Sync invited users (requires manual confirmation)
- `npm run health-check` - Run system health verification
- `npm run production-monitoring` - Start production monitoring

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15+ with App Router
- **Authentication**: Clerk (comprehensive user management)
- **Database**: PostgreSQL with Prisma ORM and Row Level Security (RLS)
- **UI**: Tailwind CSS + Radix UI primitives + Framer Motion
- **State Management**: TanStack Query for server state
- **Speech Processing**: Daily.co + Deepgram integration with dual-stream audio separation

### Application Structure

#### Coach/Capture System (`app/coach/capture/`)
Advanced speech-to-text system with multiple provider support:
- **Daily.co Integration** (`lib/useDailyTranscription.ts`): Primary transcription with dual-stream audio separation (microphone vs screen audio)
- **Deepgram Direct** (`lib/useDeepgramTranscription.ts`): Direct Deepgram WebSocket integration
- **Google Cloud Speech** (`lib/useGoogleCloudTranscription.ts`): Google Cloud Speech-to-Text integration
- **Unified Components**: Shared UI components with provider-agnostic interfaces

Key transcription features:
- Real-time audio source detection (screen vs microphone)
- Advanced deduplication systems
- Diarization support for multiple speakers
- Configurable speech profiles and optimization levels

#### Planning System (`app/planejamentos/`, `components/planning/`)
Dynamic form system for business planning with AI assistance:
- **Schema-driven Forms**: Zod-based validation with conditional field rendering
- **Sector-specific Questions**: Dynamic questions based on business sector
- **Progressive Data Collection**: "Richness scoring" encourages complete client profiles
- **AI Integration**: Context-aware proposal and planning generation
- **Auto-save**: Automatic form state persistence

#### Client Management (`app/clientes/`, `components/client/`)
Comprehensive client relationship management:
- **Progressive Profile Building**: Richness indicators encourage complete data
- **Notes & Attachments**: File upload and note-taking system
- **Soft Delete**: Archive functionality with restoration capabilities
- **Search & Filtering**: Advanced client discovery and organization

#### Proposal System (`app/propostas/`, `components/proposals/`)
AI-powered proposal generation and management:
- **Multi-tab Forms**: Structured proposal creation (Basic Info, Scope, Commercial)
- **Real-time Status Tracking**: WebSocket-based status updates
- **PDF Export**: Professional proposal document generation
- **Client Context Integration**: Leverages client data for personalized proposals

### Database Architecture

#### Security Model
- **Row Level Security (RLS)**: All data access controlled at database level
- **User-based Isolation**: Each user can only access their own data
- **Clerk Integration**: Authentication state synchronized with database permissions

#### Key Models
- **User**: Clerk-synchronized user profiles with approval system
- **Client**: Customer information with progressive data enrichment
- **Planning**: Dynamic planning forms with AI-generated content
- **Proposal**: Business proposals with status tracking and collaboration
- **AgentInteraction**: AI conversation history and context

### Authentication & Authorization

#### Clerk Integration
- **Middleware Protection**: Route-level protection via `middleware.ts`
- **User Sync**: Automatic user synchronization between Clerk and database
- **Approval System**: Admin-controlled user approval workflow
- **Role Management**: User roles and permissions system

#### Protected Routes
- All `/app` routes except auth pages require authentication
- Admin routes (`/admin/*`) require elevated permissions
- API routes use Clerk authentication context

### Form System Architecture

#### Dynamic Field System
- **Field Types**: Support for text, select, multiselect, numeric, toggle, and custom fields
- **Conditional Logic**: Fields that appear/hide based on other field values
- **Validation**: Zod schemas with real-time validation feedback
- **Auto-save**: Background persistence of form state

#### Sector Configuration
- **Sector-specific Questions**: Different question sets per business sector
- **Maturity Assessments**: Marketing and commercial maturity evaluations
- **Dynamic Scoring**: Real-time calculation of data completeness

### State Management Patterns

#### Server State (TanStack Query)
- **Query Keys**: Centralized key management in `lib/react-query/queryKeys.ts`
- **Mutation Hooks**: Standardized mutation patterns with optimistic updates
- **Polling**: Real-time updates for time-sensitive data (proposals, AI generation)
- **Cache Management**: Strategic cache invalidation and updates

#### Form State
- **React Hook Form**: Form validation and state management
- **Persistence**: Auto-save functionality across all major forms
- **Cross-tab Sync**: Form state synchronized across browser tabs

### AI Integration Points

#### Context Building
- **Client Context**: Rich client profiles fed to AI for personalization
- **Sector Knowledge**: Industry-specific prompts and templates
- **Historical Data**: Previous interactions inform future AI responses

#### Generation Workflows
- **Proposal Generation**: AI creates proposals based on client context and requirements
- **Planning Assistance**: AI helps generate strategic plans and recommendations
- **Content Refinement**: Iterative improvement of AI-generated content

### Testing Strategy
- **Jest Configuration**: Unit and integration tests
- **API Testing**: Comprehensive API endpoint testing
- **Component Testing**: React component testing with React Testing Library

### Development Practices

#### Code Organization
- **Feature-based Structure**: Components organized by business domain
- **Shared Components**: Reusable UI components in `components/shared/`
- **Type Safety**: Comprehensive TypeScript usage throughout
- **Schema Validation**: Zod schemas for all data structures

#### Performance Considerations
- **Query Optimization**: Efficient database queries with proper indexing
- **Code Splitting**: Dynamic imports for large features
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Regular bundle size monitoring

### Transcription System Details

#### Daily.co Implementation
The primary transcription system uses Daily.co as a proxy to Deepgram with enhanced dual-stream capabilities:
- **Enhanced Detection**: Multi-layered audio source detection (track_type, speaker_id, fallback heuristics)
- **Debug Tools**: Manual source forcing for testing and development
- **Real-time Analytics**: Speaker statistics and confidence tracking
- **Error Recovery**: Automatic fallback to basic configuration on API rejection

#### Integration Testing
- Test page available at `/test-transcription` with comprehensive debugging tools
- Manual source override buttons for testing different audio channels
- Real-time logging and analytics for troubleshooting

### Environment Configuration
- **Database**: Requires `DATABASE_URL` and `DIRECT_URL` for Supabase/PostgreSQL
- **Authentication**: Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Speech Services**: Daily.co and Deepgram API keys for transcription features
- **AI Services**: OpenAI or similar for content generation