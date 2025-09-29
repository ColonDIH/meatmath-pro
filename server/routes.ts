import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOrganizationSchema,
  insertCustomerSchema,
  insertProcessingRecordSchema,
  insertAnimalHeadSchema,
  insertCutInstructionSchema,
  insertInventoryItemSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertSpeciesSchema,
} from "@shared/schema";
import { z } from "zod";
import securityMiddleware from "./middleware/security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware - apply before auth and routes
  app.use(securityMiddleware.securityHeaders);
  app.use(securityMiddleware.requestLogger);
  app.use(securityMiddleware.sanitizeInput);
  app.use(securityMiddleware.sqlInjectionProtection);
  
  // API rate limiting
  app.use('/api', securityMiddleware.apiRateLimiter);
  app.use('/api/login', securityMiddleware.authRateLimiter);
  app.use('/api/callback', securityMiddleware.authRateLimiter);
  
  // Auth middleware
  await setupAuth(app);

  // Seed default species data
  await seedDefaultSpecies();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.get('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizations = await storage.getUserOrganizations(userId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgData = insertOrganizationSchema.parse(req.body);
      
      const organization = await storage.createOrganization(orgData);
      
      // Add user as owner
      await storage.addOrganizationMember({
        organizationId: organization.id,
        userId: userId,
        role: 'owner',
        joinedAt: new Date(),
      });
      
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.id;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const organization = await storage.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const metrics = await storage.getDashboardMetrics(orgId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Species routes
  app.get('/api/species', isAuthenticated, async (req: any, res) => {
    try {
      // Species are global but require authentication to access
      const species = await storage.getAllSpecies();
      res.json(species);
    } catch (error) {
      console.error("Error fetching species:", error);
      res.status(500).json({ message: "Failed to fetch species" });
    }
  });

  app.post('/api/species', securityMiddleware.adminRateLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const speciesData = insertSpeciesSchema.parse(req.body);
      
      // Only allow users with owner/admin role in at least one organization to create species
      const userOrganizations = await storage.getUserOrganizations(userId);
      const hasAdminRole = await Promise.all(
        userOrganizations.map(async org => {
          const role = await storage.getUserRole(userId, org.id);
          return role === 'owner' || role === 'admin';
        })
      );
      
      if (userOrganizations.length === 0 || !hasAdminRole.some(Boolean)) {
        return res.status(403).json({ 
          message: "Access denied. Only organization owners and admins can create species." 
        });
      }
      
      const species = await storage.createSpecies(speciesData);
      res.json(species);
    } catch (error) {
      console.error("Error creating species:", error);
      res.status(500).json({ message: "Failed to create species" });
    }
  });

  // Customer routes
  app.get('/api/customers/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const customers = await storage.getCustomers(orgId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerData = insertCustomerSchema.parse(req.body);
      
      const role = await storage.getUserRole(userId, customerData.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = req.params.id;
      const customerData = insertCustomerSchema.partial().parse(req.body);
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const role = await storage.getUserRole(userId, existingCustomer.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const customer = await storage.updateCustomer(customerId, customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = req.params.id;
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const role = await storage.getUserRole(userId, existingCustomer.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCustomer(customerId);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Processing record routes
  app.get('/api/processing-records/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const records = await storage.getProcessingRecords(orgId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching processing records:", error);
      res.status(500).json({ message: "Failed to fetch processing records" });
    }
  });

  app.post('/api/processing-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordData = insertProcessingRecordSchema.parse(req.body);
      
      const role = await storage.getUserRole(userId, recordData.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const record = await storage.createProcessingRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating processing record:", error);
      res.status(500).json({ message: "Failed to create processing record" });
    }
  });

  // Inventory routes
  app.get('/api/inventory/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const items = await storage.getInventoryItems(orgId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertInventoryItemSchema.parse(req.body);
      
      const role = await storage.getUserRole(userId, itemData.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Invoice routes
  app.get('/api/invoices/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const invoices = await storage.getInvoices(orgId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceData = insertInvoiceSchema.parse(req.body);
      
      const role = await storage.getUserRole(userId, invoiceData.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Cut instruction routes
  app.get('/api/cut-instructions/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgId = req.params.orgId;
      
      const role = await storage.getUserRole(userId, orgId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const instructions = await storage.getCutInstructions(orgId);
      res.json(instructions);
    } catch (error) {
      console.error("Error fetching cut instructions:", error);
      res.status(500).json({ message: "Failed to fetch cut instructions" });
    }
  });

  app.post('/api/cut-instructions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const instructionData = insertCutInstructionSchema.parse(req.body);
      
      const role = await storage.getUserRole(userId, instructionData.organizationId!);
      if (!role || !['owner', 'admin', 'editor'].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const instruction = await storage.createCutInstruction(instructionData);
      res.json(instruction);
    } catch (error) {
      console.error("Error creating cut instruction:", error);
      res.status(500).json({ message: "Failed to create cut instruction" });
    }
  });

  // Global error handler - must be last
  app.use(securityMiddleware.globalErrorHandler);

  const httpServer = createServer(app);
  return httpServer;
}

async function seedDefaultSpecies() {
  try {
    const existingSpecies = await storage.getAllSpecies();
    if (existingSpecies.length === 0) {
      const defaultSpecies = [
        {
          name: "Beef Cattle",
          category: "beef",
          liveToHangingRatio: "0.6250",
          hangingToRetailRatio: "0.7420",
          averageProcessingCost: "347.50",
          description: "Standard beef cattle processing",
        },
        {
          name: "Pork",
          category: "pork",
          liveToHangingRatio: "0.7200",
          hangingToRetailRatio: "0.7180",
          averageProcessingCost: "125.00",
          description: "Standard pork processing",
        },
        {
          name: "Lamb",
          category: "lamb",
          liveToHangingRatio: "0.5800",
          hangingToRetailRatio: "0.6940",
          averageProcessingCost: "89.00",
          description: "Standard lamb processing",
        },
        {
          name: "Deer",
          category: "game",
          liveToHangingRatio: "0.5500",
          hangingToRetailRatio: "0.6610",
          averageProcessingCost: "75.00",
          description: "Wild game deer processing",
        },
      ];

      for (const species of defaultSpecies) {
        await storage.createSpecies(species);
      }
    }
  } catch (error) {
    console.error("Error seeding default species:", error);
  }
}
