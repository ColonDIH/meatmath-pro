# MeatMath Pro - Beef Processing Management SaaS

## Overview

MeatMath Pro is a comprehensive SaaS platform for beef processing businesses that provides yield calculations, inventory management, point-of-sale capabilities, customer management, and business analytics. The application is built with a modern full-stack architecture using React frontend and Node.js/Express backend with PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern monorepo structure with clear separation between client, server, and shared components:

### Frontend Architecture
- **React 18.3.1** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient server state management
- **Radix UI** components with **Tailwind CSS** for consistent styling
- **Zustand** for local state management

### Backend Architecture
- **Node.js** with **Express.js** framework
- **TypeScript** throughout the backend for type safety
- **RESTful API** design with proper error handling
- **Replit Auth** integration for authentication
- **Session-based authentication** with PostgreSQL session store

### Database Architecture
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Neon Database** for serverless PostgreSQL hosting
- **Multi-tenant design** with organization-based data isolation

## Key Components

### Authentication System
- Replit-based OAuth authentication
- Session management with PostgreSQL storage
- Role-based access control within organizations
- User profile management with avatars

### Multi-tenant Organization Structure
- Organizations as primary tenant boundaries
- User-organization membership with roles
- Data isolation by organization ID across all tables
- Organization switching capability

### Core Business Modules
1. **Yield Calculator** - Industry-standard beef processing calculations
2. **Processing Records** - Track animal processing from intake to completion
3. **Inventory Management** - Real-time inventory tracking with low-stock alerts
4. **Customer Management** - Complete customer database with contact information
5. **Point-of-Sale (POS)** - Invoice generation and sales processing
6. **Species Management** - Configurable animal species with processing parameters
7. **Business Analytics** - Dashboard with metrics and reporting

### UI Component System
- **Shadcn/UI** components for consistent design
- **Responsive design** with mobile-first approach
- **Dark mode support** through CSS variables
- **Accessibility** considerations throughout

## Data Flow

### Client-Server Communication
1. Frontend makes API requests to Express backend
2. Backend validates requests and authenticates users
3. Database operations performed through Drizzle ORM
4. Responses formatted and returned to client
5. Client updates UI state through TanStack Query

### Authentication Flow
1. User initiates login through Replit Auth
2. Backend validates OAuth tokens
3. Session created and stored in PostgreSQL
4. User profile synchronized with local database
5. Organization membership checked for access control

### Business Process Flow
1. **Animal Intake** - Create processing record with customer and species
2. **Yield Calculation** - Calculate hanging and retail weights
3. **Inventory Update** - Add processed cuts to inventory
4. **Sales Processing** - Create invoices and update inventory
5. **Analytics Update** - Real-time metrics calculation

## External Dependencies

### Authentication
- **Replit Auth** - OAuth-based authentication system
- **OpenID Connect** - Standard authentication protocol

### Database
- **Neon Database** - Serverless PostgreSQL hosting
- **Connection pooling** for efficient database access

### Payment Processing
- **Stripe** integration for subscription billing
- Support for both one-time and recurring payments

### Development Tools
- **Vite** - Fast build tool and development server
- **TypeScript** - Static type checking
- **ESLint** and **Prettier** - Code quality and formatting

## Deployment Strategy

### Development Environment
- **Replit** development environment with hot reloading
- **Vite dev server** for frontend development
- **tsx** for TypeScript execution in development

### Production Build
- **Vite build** for optimized frontend bundle
- **esbuild** for backend bundling
- **Static file serving** from Express server

### Database Management
- **Drizzle Kit** for database migrations
- **Schema versioning** with migration files
- **Environment-based configuration**

### Environment Configuration
- **DATABASE_URL** - PostgreSQL connection string
- **SESSION_SECRET** - Session encryption key
- **REPL_ID** - Replit environment identifier
- **NODE_ENV** - Environment mode (development/production)

The application is designed to scale horizontally with proper multi-tenant isolation and efficient database queries. The architecture supports both development and production deployments with minimal configuration changes.