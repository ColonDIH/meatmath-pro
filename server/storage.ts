import {
  users,
  organizations,
  organizationMembers,
  species,
  customers,
  processingRecords,
  animalHeads,
  cutInstructions,
  inventoryItems,
  invoices,
  invoiceItems,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type OrganizationMember,
  type InsertOrganizationMember,
  type Species,
  type InsertSpecies,
  type Customer,
  type InsertCustomer,
  type ProcessingRecord,
  type InsertProcessingRecord,
  type AnimalHead,
  type InsertAnimalHead,
  type CutInstruction,
  type InsertCutInstruction,
  type InventoryItem,
  type InsertInventoryItem,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, avg } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  
  // Organization member operations
  addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>;
  getUserRole(userId: string, orgId: string): Promise<string | null>;
  
  // Species operations
  getAllSpecies(): Promise<Species[]>;
  getSpecies(id: string): Promise<Species | undefined>;
  createSpecies(species: InsertSpecies): Promise<Species>;
  
  // Customer operations
  getCustomers(orgId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Processing record operations
  getProcessingRecords(orgId: string): Promise<ProcessingRecord[]>;
  getProcessingRecord(id: string): Promise<ProcessingRecord | undefined>;
  createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord>;
  updateProcessingRecord(id: string, record: Partial<InsertProcessingRecord>): Promise<ProcessingRecord>;
  deleteProcessingRecord(id: string): Promise<void>;
  
  // Animal head operations
  getAnimalHeadsByRecord(recordId: string): Promise<AnimalHead[]>;
  createAnimalHead(head: InsertAnimalHead): Promise<AnimalHead>;
  
  // Cut instruction operations
  getCutInstructions(orgId: string): Promise<CutInstruction[]>;
  getCutInstruction(id: string): Promise<CutInstruction | undefined>;
  createCutInstruction(instruction: InsertCutInstruction): Promise<CutInstruction>;
  updateCutInstruction(id: string, instruction: Partial<InsertCutInstruction>): Promise<CutInstruction>;
  deleteCutInstruction(id: string): Promise<void>;
  
  // Inventory operations
  getInventoryItems(orgId: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;
  
  // Invoice operations
  getInvoices(orgId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  
  // Invoice item operations
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  
  // Dashboard metrics
  getDashboardMetrics(orgId: string): Promise<{
    totalAnimals: number;
    revenue: number;
    averageYield: number;
    activeCustomers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(org)
      .returning();
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        industry: organizations.industry,
        logo: organizations.logo,
        website: organizations.website,
        phone: organizations.phone,
        email: organizations.email,
        address: organizations.address,
        settings: organizations.settings,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
      .where(and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.isActive, true)
      ));
    return orgs;
  }

  // Organization member operations
  async addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember> {
    const [orgMember] = await db
      .insert(organizationMembers)
      .values(member)
      .returning();
    return orgMember;
  }

  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.isActive, true)
      ));
  }

  async getUserRole(userId: string, orgId: string): Promise<string | null> {
    const [member] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.isActive, true)
      ));
    return member?.role || null;
  }

  // Species operations
  async getAllSpecies(): Promise<Species[]> {
    return await db
      .select()
      .from(species)
      .where(eq(species.isActive, true))
      .orderBy(species.name);
  }

  async getSpecies(id: string): Promise<Species | undefined> {
    const [speciesRecord] = await db
      .select()
      .from(species)
      .where(eq(species.id, id));
    return speciesRecord;
  }

  async createSpecies(speciesData: InsertSpecies): Promise<Species> {
    const [speciesRecord] = await db
      .insert(species)
      .values(speciesData)
      .returning();
    return speciesRecord;
  }

  // Customer operations
  async getCustomers(orgId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.organizationId, orgId),
        eq(customers.isActive, true)
      ))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  // Processing record operations
  async getProcessingRecords(orgId: string): Promise<ProcessingRecord[]> {
    return await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.organizationId, orgId))
      .orderBy(desc(processingRecords.processingDate));
  }

  async getProcessingRecord(id: string): Promise<ProcessingRecord | undefined> {
    const [record] = await db
      .select()
      .from(processingRecords)
      .where(eq(processingRecords.id, id));
    return record;
  }

  async createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord> {
    const [newRecord] = await db
      .insert(processingRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateProcessingRecord(id: string, record: Partial<InsertProcessingRecord>): Promise<ProcessingRecord> {
    const [updatedRecord] = await db
      .update(processingRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(processingRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteProcessingRecord(id: string): Promise<void> {
    await db
      .delete(processingRecords)
      .where(eq(processingRecords.id, id));
  }

  // Animal head operations
  async getAnimalHeadsByRecord(recordId: string): Promise<AnimalHead[]> {
    return await db
      .select()
      .from(animalHeads)
      .where(eq(animalHeads.processingRecordId, recordId))
      .orderBy(animalHeads.animalNumber);
  }

  async createAnimalHead(head: InsertAnimalHead): Promise<AnimalHead> {
    const [newHead] = await db
      .insert(animalHeads)
      .values(head)
      .returning();
    return newHead;
  }

  // Cut instruction operations
  async getCutInstructions(orgId: string): Promise<CutInstruction[]> {
    return await db
      .select()
      .from(cutInstructions)
      .where(eq(cutInstructions.organizationId, orgId))
      .orderBy(desc(cutInstructions.createdAt));
  }

  async getCutInstruction(id: string): Promise<CutInstruction | undefined> {
    const [instruction] = await db
      .select()
      .from(cutInstructions)
      .where(eq(cutInstructions.id, id));
    return instruction;
  }

  async createCutInstruction(instruction: InsertCutInstruction): Promise<CutInstruction> {
    const [newInstruction] = await db
      .insert(cutInstructions)
      .values(instruction)
      .returning();
    return newInstruction;
  }

  async updateCutInstruction(id: string, instruction: Partial<InsertCutInstruction>): Promise<CutInstruction> {
    const [updatedInstruction] = await db
      .update(cutInstructions)
      .set({ ...instruction, updatedAt: new Date() })
      .where(eq(cutInstructions.id, id))
      .returning();
    return updatedInstruction;
  }

  async deleteCutInstruction(id: string): Promise<void> {
    await db
      .delete(cutInstructions)
      .where(eq(cutInstructions.id, id));
  }

  // Inventory operations
  async getInventoryItems(orgId: string): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.organizationId, orgId),
        eq(inventoryItems.isActive, true)
      ))
      .orderBy(inventoryItems.name);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db
      .insert(inventoryItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db
      .update(inventoryItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id));
  }

  // Invoice operations
  async getInvoices(orgId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.organizationId, orgId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
  }

  // Invoice item operations
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db
      .insert(invoiceItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Dashboard metrics
  async getDashboardMetrics(orgId: string): Promise<{
    totalAnimals: number;
    revenue: number;
    averageYield: number;
    activeCustomers: number;
  }> {
    // Get total animals from processing records
    const [animalCount] = await db
      .select({ count: count() })
      .from(processingRecords)
      .where(eq(processingRecords.organizationId, orgId));

    // Get revenue from invoices
    const [revenueSum] = await db
      .select({ sum: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, orgId),
        eq(invoices.status, 'paid')
      ));

    // Get average yield
    const [avgYield] = await db
      .select({ avg: avg(processingRecords.totalRetailWeight) })
      .from(processingRecords)
      .where(eq(processingRecords.organizationId, orgId));

    // Get active customers
    const [customerCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(and(
        eq(customers.organizationId, orgId),
        eq(customers.isActive, true)
      ));

    return {
      totalAnimals: animalCount.count || 0,
      revenue: parseFloat(revenueSum.sum || "0"),
      averageYield: parseFloat(avgYield.avg || "0"),
      activeCustomers: customerCount.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
