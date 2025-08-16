# Replit.md

## Overview

The National Dialogue ZA Admin Portal is a full-stack TypeScript application designed as the system of record for managing South Africa's National Dialogue programme. The system provides comprehensive tools for administrators to handle citizen submissions, manage cases, track analytics, and oversee user management across multiple government levels (national, provincial, municipal).

The application features a React-based admin interface with a Node.js backend, supporting multi-channel submission processing (mobile, web, WhatsApp, social media), automated content moderation, case routing to appropriate departments, and real-time analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using functional components and hooks
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Form Handling**: React Hook Form with Zod schema validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with OpenAPI documentation
- **Authentication**: JWT-based auth with access/refresh token pattern using bcrypt for password hashing
- **Authorization**: Role-based access control (RBAC) with permissions system
- **Validation**: Zod schemas for runtime type checking and input validation
- **Error Handling**: Centralized error handling with structured API responses

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations for version control
- **Connection**: Connection pooling with @neondatabase/serverless

### Data Model Design
The system uses a comprehensive relational data model including:
- **User Management**: Users, roles, permissions with many-to-many relationships
- **Content Management**: Submissions with multi-channel support, sentiment analysis, and toxicity detection
- **Case Management**: Cases linked to submissions with department routing and SLA tracking
- **Administrative**: Departments with jurisdiction-based organization, topic taxonomy, and audit logging
- **Engagement**: Polls system for citizen feedback collection

### Authentication & Security
- **JWT Implementation**: Separate access (15min) and refresh (7 days) tokens
- **Password Security**: bcrypt with 12 rounds for password hashing
- **Rate Limiting**: API endpoint protection against abuse
- **CORS**: Configured for mobile and admin portal origins
- **Input Validation**: Comprehensive validation using Zod schemas
- **Audit Trail**: Complete action logging for compliance

### File Upload Architecture
- **Primary**: Google Cloud Storage integration for media files
- **Fallback**: AWS S3 support via Uppy file upload components
- **Frontend**: Uppy Dashboard with drag-and-drop support

### Development Experience
- **Monorepo Structure**: Single repository with client and server workspaces
- **Hot Reload**: Vite HMR for frontend, tsx for backend development
- **Type Safety**: End-to-end TypeScript with shared schemas
- **Build Process**: esbuild for server bundling, Vite for client optimization

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### Cloud Storage
- **Google Cloud Storage**: Primary file storage for media uploads
- **AWS S3**: Secondary storage option with Uppy integration

### Authentication Services
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation

### UI Component Libraries
- **Radix UI**: Headless, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript/TypeScript bundler for backend
- **tsx**: TypeScript execution for Node.js development

### API & Validation
- **Zod**: Runtime type validation and schema generation
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation

### Monitoring & Analytics
- **Audit Logging**: Built-in system for tracking all administrative actions
- **Performance Monitoring**: Request/response logging with timing metrics