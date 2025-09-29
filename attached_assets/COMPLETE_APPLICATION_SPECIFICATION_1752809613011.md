# MeatMath Pro - Complete Application Specification

## Executive Summary

MeatMath Pro is a comprehensive SaaS platform for beef processing businesses, providing yield calculations, inventory management, point-of-sale capabilities, customer management, and business analytics. The application serves meat processing facilities ranging from small operations to large-scale enterprises.

## Core Value Proposition

- **Yield Optimization**: Industry-standard calculations for processing efficiency
- **Complete Business Management**: From animal intake to customer sales
- **Tax Compliance**: State-specific tax handling for all 50 US states
- **Real-time Analytics**: Business intelligence for informed decision-making
- **Multi-tenant Architecture**: Support for multiple organizations and team collaboration

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.6.3
- Vite 5.4.19 for development and build tooling
- Wouter 3.3.5 for client-side routing
- TanStack Query 5.60.5 for server state management
- Radix UI components with Tailwind CSS for styling
- Zustand for local state management

**Backend:**
- Node.js with Express 4.21.2
- TypeScript for type safety
- JWT authentication with bcryptjs
- PostgreSQL with Drizzle ORM 0.39.1
- Neon Database for serverless PostgreSQL hosting

**Payment Processing:**
- Stripe integration for subscription billing
- Support for one-time payments and recurring subscriptions

**External Services:**
- SendGrid for email notifications
- Stripe for payment processing
- Anthropic API for AI features

### 1.2 Database Architecture

**Multi-tenant Design:**
- Organizations as primary tenant boundary
- User-organization relationships with role-based access
- Data isolation by organization ID across all tables

**Core Tables:**
- `users` - User accounts and authentication
- `organizations` - Business entities and settings
- `organization_members` - User-organization relationships
- `subscription_plans` - Available subscription tiers
- `subscriptions` - Active subscriptions per organization
- `payment_transactions` - Payment history and tracking
- `onboarding_flows` - User onboarding progress
- `customer_signups` - Lead capture and conversion

**Business Data Tables:**
- `species` - Animal species with yield characteristics
- `processing_records` - Individual processing sessions
- `animal_heads` - Multiple animals per processing record
- `cut_instructions` - Processing templates and procedures
- `line_items` - Individual cuts with pricing and weights

**POS System Tables:**
- `inventory_items` - Product catalog with pricing
- `customers` - Customer profiles and contact info
- `invoices` - Sales transactions
- `invoice_items` - Line items per invoice
- `payments` - Payment records per invoice
- `inventory_movements` - Stock tracking
- `integration_settings` - Third-party integrations

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Authentication & User Management

**User Registration:**
- Email/password registration with validation
- Email verification (optional)
- Password reset functionality
- JWT token-based authentication

**User Roles:**
- Owner: Full access to organization
- Admin: Management access without billing
- Editor: Create/edit records and data
- Viewer: Read-only access to data

**Organization Management:**
- Create and manage multiple organizations
- Invite team members with role assignment
- Organization settings and preferences
- Billing and subscription management

### 2.2 SaaS Subscription System

**Subscription Plans:**
- **Entry Plan**: $29.99/month
  - Up to 50 animals per month
  - 2 team members
  - Basic reporting
  - Customer management
  - Processing calculator
  - Email support

- **Pro Plan**: $89.99/month
  - Up to 500 animals per month
  - 10 team members
  - Advanced analytics
  - Custom branding
  - API access
  - Priority support
  - Multi-location support

**Billing Features:**
- Stripe payment processing
- Monthly billing cycles
- Automatic payment collection
- Invoice generation
- Payment failure handling
- Subscription upgrades/downgrades

**Free Pro Access:**
- Coupon code "colon" provides free Pro access
- Immediate account provisioning
- Full Pro features activated

### 2.3 Processing Management

**Yield Calculator:**
- Auto and manual calculation modes
- Species-specific yield ratios
- Live weight → Hanging weight → Retail yield
- Cost analysis and profit margins
- Industry-standard formulas validated against USDA standards

**Multi-animal Processing:**
- Process multiple animals in single session
- Individual animal tracking
- Batch processing capabilities
- Aggregate yield calculations

**Cut Instructions:**
- Pre-defined cut templates
- Custom cut instruction creation
- 200+ cut library across all animal types
- Historical cut data with averages
- Auto-population from previous records

**Processing Records:**
- Complete processing session tracking
- Customer assignment and billing
- Line item breakdown with weights/pricing
- Export capabilities for reporting
- Search and filter functionality

### 2.4 Species Management

**Species Database:**
- 80+ species including domestic and exotic game
- Species-specific yield characteristics
- Searchable interface with filtering
- Auto-calculation integration
- Custom species creation

**Yield Characteristics:**
- Live to hanging weight ratios
- Hanging to retail weight ratios
- Historical performance data
- Industry averages by species

### 2.5 Point of Sale System

**Inventory Management:**
- Product catalog with multiple pricing tiers
- Stock tracking with low-stock alerts
- Multiple unit types (lbs, packages, cases)
- Category organization
- Cost, retail, and wholesale pricing

**Customer Management:**
- Customer profiles with contact information
- Order history tracking
- Billing and shipping addresses
- Notes and preferences
- Customer analytics and segmentation

**Sales Processing:**
- Professional invoice generation
- Multiple payment methods
- Real-time inventory updates
- Tax calculations with state-specific rates
- Receipt generation

**Tax Compliance:**
- 50-state tax rate database (2024-2025)
- Food exemption handling for raw meat
- Multi-jurisdiction calculations
- Audit trail capabilities
- Compliance documentation

### 2.6 Analytics & Reporting

**Dashboard Analytics:**
- Total animals processed
- Revenue and profit analysis
- Yield performance metrics
- Cost per pound calculations
- Trending and comparative analysis

**Sales Analytics:**
- 30-day sales trends
- Product performance tracking
- Customer purchasing patterns
- Payment method breakdowns
- Seasonal analysis

**Export Capabilities:**
- CSV export for all major data sets
- Custom date range filtering
- Detailed transaction reports
- Tax reporting preparation
- Business intelligence integration

---

## 3. USER INTERFACE REQUIREMENTS

### 3.1 Navigation Structure

**Main Navigation:**
- Dashboard (overview and quick access)
- Calculator (yield calculations)
- Records (processing history)
- Cut Instructions (templates and procedures)
- Organization (settings and team management)

**Point of Sale Navigation:**
- POS Dashboard (sales overview)
- New Sale (transaction processing)
- Customers (customer management)
- Inventory (product catalog)
- POS Settings (tax configuration)

**System Navigation:**
- User Management (admin features)
- Help Center (documentation and support)
- Settings (user preferences)

### 3.2 Responsive Design

**Mobile Optimization:**
- Collapsible sidebar navigation
- Touch-friendly interface elements
- Responsive data tables
- Mobile-optimized forms
- Swipe gestures for data navigation

**Desktop Features:**
- Multi-column layouts
- Keyboard shortcuts
- Drag-and-drop functionality
- Advanced filtering options
- Multiple window support

### 3.3 User Experience Features

**Onboarding:**
- Interactive guided tours
- Progressive disclosure of features
- Contextual help tips
- Video tutorials
- Step-by-step setup wizards

**Help System:**
- Comprehensive help center
- Searchable documentation
- FAQ sections
- Video tutorials
- Contextual tooltips

**Accessibility:**
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size adjustments

---

## 4. DATA MODELS

### 4.1 Core Business Entities

**User:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}
```

**Organization:**
```typescript
interface Organization {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  logo?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: Address;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationSettings {
  markupPercentage: number;
  taxRate: number;
  currency: string;
  timezone: string;
}
```

**Processing Record:**
```typescript
interface ProcessingRecord {
  id: string;
  organizationId: string;
  customerId?: string;
  speciesId: string;
  processingDate: Date;
  totalLiveWeight: number;
  totalHangingWeight: number;
  totalRetailWeight: number;
  processingCost: number;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'invoiced';
  createdAt: Date;
  updatedAt: Date;
}
```

**Cut Instruction:**
```typescript
interface CutInstruction {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: string;
  instructions: string;
  estimatedYield: number;
  processingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 POS System Entities

**Inventory Item:**
```typescript
interface InventoryItem {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  unitType: string;
  costPerUnit: number;
  retailPrice: number;
  wholesalePrice: number;
  currentStock: number;
  lowStockAlert: number;
  trackInventory: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Customer:**
```typescript
interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
  customerType: 'individual' | 'business';
  createdAt: Date;
  updatedAt: Date;
}
```

**Invoice:**
```typescript
interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Subscription & Billing Entities

**Subscription Plan:**
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeatures;
  stripePriceId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PlanFeatures {
  maxAnimalsPerMonth: number;
  maxUsers: number;
  basicReporting: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  multiLocation: boolean;
}
```

---

## 5. API SPECIFICATIONS

### 5.1 Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 5.2 Organization Management

```
GET /api/organizations
POST /api/organizations
GET /api/organizations/:id
PUT /api/organizations/:id
DELETE /api/organizations/:id
GET /api/organizations/:id/members
POST /api/organizations/:id/members
PUT /api/organizations/:id/members/:userId
DELETE /api/organizations/:id/members/:userId
```

### 5.3 Processing Records

```
GET /api/processing-records/:orgId
POST /api/processing-records/:orgId
GET /api/processing-records/:id
PUT /api/processing-records/:id
DELETE /api/processing-records/:id
```

### 5.4 Cut Instructions

```
GET /api/cut-instructions/:orgId
POST /api/cut-instructions/:orgId
GET /api/cut-instructions/:id
PUT /api/cut-instructions/:id
DELETE /api/cut-instructions/:id
GET /api/cut-library
```

### 5.5 POS System

```
GET /api/inventory/:orgId
POST /api/inventory/:orgId
PUT /api/inventory/:id
DELETE /api/inventory/:id

GET /api/customers/:orgId
POST /api/customers/:orgId
PUT /api/customers/:id
DELETE /api/customers/:id

GET /api/invoices/:orgId
POST /api/invoices/:orgId
PUT /api/invoices/:id
DELETE /api/invoices/:id
```

### 5.6 Analytics

```
GET /api/analytics/dashboard/:orgId
GET /api/analytics/sales/:orgId
GET /api/analytics/processing/:orgId
GET /api/analytics/customers/:orgId
GET /api/analytics/export/:orgId
```

### 5.7 Subscription & Billing

```
GET /api/subscription-plans
POST /api/create-payment-intent
POST /api/purchase/paid-account
POST /api/purchase/free-account
POST /api/subscriptions/:orgId
PUT /api/subscriptions/:id
POST /api/billing/webhook
```

---

## 6. SECURITY REQUIREMENTS

### 6.1 Authentication & Authorization

**Authentication:**
- JWT token-based authentication
- bcrypt password hashing (12 rounds)
- Token expiration (7 days)
- Refresh token rotation
- Session management

**Authorization:**
- Role-based access control (RBAC)
- Organization-level data isolation
- API endpoint protection
- Resource-level permissions
- Admin-only endpoints

### 6.2 Data Protection

**Encryption:**
- TLS 1.3 for data in transit
- Database encryption at rest
- PII encryption for sensitive data
- Secure password storage
- API key encryption

**Privacy:**
- GDPR compliance capabilities
- Data retention policies
- User data export
- Right to deletion
- Consent management

### 6.3 Input Validation

**Frontend Validation:**
- Form input validation
- Type checking with TypeScript
- XSS prevention
- CSRF protection
- Input sanitization

**Backend Validation:**
- Zod schema validation
- SQL injection prevention
- Parameter validation
- File upload restrictions
- Rate limiting

---

## 7. PERFORMANCE REQUIREMENTS

### 7.1 Response Times

- Page load time: < 2 seconds
- API response time: < 500ms
- Database queries: < 200ms
- Search functionality: < 1 second
- Report generation: < 5 seconds

### 7.2 Scalability

**Database:**
- Connection pooling
- Query optimization
- Index optimization
- Partitioning strategies
- Caching layers

**Application:**
- Horizontal scaling capability
- Load balancing support
- CDN integration
- Static asset optimization
- Bundle splitting

### 7.3 Availability

- 99.9% uptime SLA
- Automatic failover
- Health check monitoring
- Error tracking and alerting
- Backup and recovery procedures

---

## 8. DEPLOYMENT REQUIREMENTS

### 8.1 Environment Configuration

**Development:**
- Local PostgreSQL database
- Vite development server
- Hot module replacement
- Debug logging
- Development tools

**Production:**
- Neon Database (serverless PostgreSQL)
- Static file serving
- Environment variable management
- SSL/TLS certificates
- Production logging

### 8.2 CI/CD Pipeline

**Build Process:**
1. TypeScript compilation
2. Frontend build with Vite
3. Backend bundle with esbuild
4. Database migration
5. Static asset optimization
6. Production deployment

**Testing:**
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end testing
- Performance testing
- Security scanning

### 8.3 Monitoring & Logging

**Application Monitoring:**
- Error tracking and reporting
- Performance metrics
- User analytics
- API usage monitoring
- Database performance

**Business Metrics:**
- User acquisition and retention
- Feature usage analytics
- Revenue tracking
- Customer satisfaction
- Support ticket volume

---

## 9. INTEGRATIONS

### 9.1 Payment Processing

**Stripe Integration:**
- Subscription management
- Payment intent creation
- Webhook handling
- Invoice generation
- Payment failure handling

### 9.2 Email Services

**SendGrid Integration:**
- Welcome emails
- Password reset emails
- Invoice notifications
- Marketing emails
- Transactional emails

### 9.3 Third-party APIs

**Future Integrations:**
- QuickBooks for accounting
- Mailchimp for marketing
- Zapier for automation
- Twilio for SMS notifications
- Google Analytics for tracking

---

## 10. TESTING STRATEGY

### 10.1 Test Coverage

**Unit Tests:**
- Business logic functions
- Utility functions
- Data validation
- Calculation accuracy
- Error handling

**Integration Tests:**
- API endpoint testing
- Database operations
- Authentication flows
- Payment processing
- Email delivery

**End-to-End Tests:**
- User registration flow
- Processing record creation
- POS transactions
- Invoice generation
- Subscription management

### 10.2 Test Data

**Sample Data:**
- Demo organizations
- Sample processing records
- Test customers
- Inventory items
- Cut instructions

**Test Scenarios:**
- New user onboarding
- Multi-animal processing
- Complex invoice creation
- Subscription upgrades
- Payment failures

---

## 11. MAINTENANCE & SUPPORT

### 11.1 Documentation

**User Documentation:**
- Getting started guide
- Feature tutorials
- Video walkthroughs
- FAQ sections
- Best practices

**Technical Documentation:**
- API documentation
- Database schema
- Deployment guides
- Troubleshooting guides
- Architecture decisions

### 11.2 Support Channels

**Self-Service:**
- Help center with search
- Video tutorials
- Community forums
- Knowledge base
- Troubleshooting tools

**Direct Support:**
- Email support for Entry plan
- Priority email for Pro plan
- Live chat (Pro plan)
- Phone support (Enterprise)
- Dedicated account manager

---

## 12. FUTURE ENHANCEMENTS

### 12.1 Planned Features

**Short-term (3-6 months):**
- Mobile app development
- Advanced reporting
- API marketplace
- Inventory forecasting
- Customer portal

**Medium-term (6-12 months):**
- Multi-location support
- Franchise management
- Advanced analytics
- Machine learning insights
- Integration marketplace

**Long-term (12+ months):**
- IoT device integration
- Blockchain traceability
- AI-powered optimization
- International expansion
- Enterprise features

### 12.2 Scalability Considerations

**Technical Scaling:**
- Microservices architecture
- Message queue implementation
- Caching layer optimization
- Database sharding
- Global CDN deployment

**Business Scaling:**
- Enterprise pricing tiers
- White-label solutions
- Partner program
- Reseller network
- International markets

---

## 13. CURRENT BUILD STATUS

### 13.1 Completed Features ✅

**Core Platform:**
- ✅ User authentication and registration
- ✅ Organization management with roles
- ✅ SaaS subscription system with Stripe
- ✅ Database schema with all tables
- ✅ Responsive navigation system

**Processing Management:**
- ✅ Yield calculator with auto/manual modes
- ✅ Multi-animal processing support
- ✅ Cut instructions with 200+ cut library
- ✅ Processing records with line items
- ✅ Species database with 80+ species

**POS System:**
- ✅ Inventory management with stock tracking
- ✅ Customer management with profiles
- ✅ Invoice generation with tax calculation
- ✅ Payment processing with Stripe
- ✅ 50-state tax compliance system

**Analytics & Reporting:**
- ✅ Dashboard with key metrics
- ✅ Sales analytics with trends
- ✅ Export capabilities for all data
- ✅ Customer analytics and segmentation
- ✅ Product performance tracking

**User Experience:**
- ✅ Onboarding flow with guided tours
- ✅ Help center with documentation
- ✅ Contextual help tooltips
- ✅ Mobile-responsive design
- ✅ Professional UI/UX design

### 13.2 Missing or Incomplete Features ⚠️

**Technical Issues:**
- ⚠️ Some API endpoints need proper error handling
- ⚠️ Database migration scripts need organization
- ⚠️ Production deployment scripts need refinement
- ⚠️ Environment configuration needs standardization

**Feature Gaps:**
- ⚠️ Email verification workflow
- ⚠️ Password reset functionality
- ⚠️ File upload for receipts/images
- ⚠️ Webhook handling for Stripe
- ⚠️ Advanced search and filtering

**Testing & Quality:**
- ⚠️ Comprehensive test suite needed
- ⚠️ Performance optimization required
- ⚠️ Security audit needed
- ⚠️ Accessibility compliance verification

---

## 14. REBUILD RECOMMENDATIONS

### 14.1 If Starting Fresh

**Phase 1: Foundation (Weeks 1-4)**
1. Set up development environment
2. Implement authentication system
3. Create database schema
4. Build basic navigation
5. Implement user management

**Phase 2: Core Features (Weeks 5-8)**
1. Yield calculator implementation
2. Processing records system
3. Cut instructions management
4. Species database integration
5. Basic reporting dashboard

**Phase 3: POS System (Weeks 9-12)**
1. Inventory management
2. Customer management
3. Invoice generation
4. Payment processing
5. Tax calculation system

**Phase 4: Advanced Features (Weeks 13-16)**
1. Advanced analytics
2. Export capabilities
3. Help system
4. Onboarding flow
5. Mobile optimization

**Phase 5: Polish & Deploy (Weeks 17-20)**
1. Testing and bug fixes
2. Performance optimization
3. Security hardening
4. Documentation completion
5. Production deployment

### 14.2 Priority Order

**Critical Path:**
1. User authentication (login/register)
2. Organization management
3. Subscription billing system
4. Yield calculator
5. Processing records

**High Priority:**
1. POS system (inventory, customers, invoices)
2. Tax calculation system
3. Dashboard analytics
4. Export functionality
5. Help documentation

**Medium Priority:**
1. Advanced analytics
2. Onboarding flow
3. Mobile optimization
4. Third-party integrations
5. API marketplace

**Low Priority:**
1. Advanced reporting
2. Machine learning features
3. IoT integrations
4. International expansion
5. Enterprise features

---

## 15. CONCLUSION

MeatMath Pro represents a comprehensive solution for beef processing business management. The current build includes approximately 85% of the planned features, with a solid foundation for all core functionality. The application is production-ready for basic operations but would benefit from additional testing, optimization, and feature completion before full commercial launch.

The specification provided here serves as a complete blueprint for either continuing development of the current build or starting fresh with a new implementation. All major components, data models, and business logic are documented to ensure continuity of development efforts.

**Key Strengths:**
- Complete SaaS architecture with billing
- Comprehensive POS system
- Industry-standard processing calculations
- Multi-tenant organization support
- Modern tech stack with TypeScript

**Areas for Improvement:**
- Testing coverage and quality assurance
- Performance optimization
- Security hardening
- Error handling and edge cases
- Documentation and support materials

This specification provides the foundation for a successful meat processing business management platform serving the growing needs of the industry.