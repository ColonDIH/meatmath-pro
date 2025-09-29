import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations (multi-tenant)
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  logo: varchar("logo"),
  website: varchar("website"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: jsonb("address"),
  settings: jsonb("settings").default({
    markupPercentage: 25,
    taxRate: 0,
    currency: "USD",
    timezone: "America/New_York"
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization members
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("viewer"), // owner, admin, editor, viewer
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  isActive: boolean("is_active").default(true),
});

// Species
export const species = pgTable("species", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // beef, pork, lamb, game, etc.
  liveToHangingRatio: decimal("live_to_hanging_ratio", { precision: 5, scale: 4 }).notNull(),
  hangingToRetailRatio: decimal("hanging_to_retail_ratio", { precision: 5, scale: 4 }).notNull(),
  averageProcessingCost: decimal("average_processing_cost", { precision: 10, scale: 2 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  billingAddress: jsonb("billing_address"),
  shippingAddress: jsonb("shipping_address"),
  notes: text("notes"),
  customerType: varchar("customer_type", { length: 20 }).notNull().default("individual"), // individual, business
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Processing records
export const processingRecords = pgTable("processing_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id),
  speciesId: uuid("species_id").references(() => species.id),
  processingDate: date("processing_date").notNull(),
  totalLiveWeight: decimal("total_live_weight", { precision: 10, scale: 2 }).notNull(),
  totalHangingWeight: decimal("total_hanging_weight", { precision: 10, scale: 2 }),
  totalRetailWeight: decimal("total_retail_weight", { precision: 10, scale: 2 }),
  processingCost: decimal("processing_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, completed, invoiced
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Animal heads (for multi-animal processing)
export const animalHeads = pgTable("animal_heads", {
  id: uuid("id").defaultRandom().primaryKey(),
  processingRecordId: uuid("processing_record_id").references(() => processingRecords.id, { onDelete: "cascade" }),
  animalNumber: integer("animal_number").notNull(),
  liveWeight: decimal("live_weight", { precision: 10, scale: 2 }).notNull(),
  hangingWeight: decimal("hanging_weight", { precision: 10, scale: 2 }),
  retailWeight: decimal("retail_weight", { precision: 10, scale: 2 }),
  tagNumber: varchar("tag_number"),
  notes: text("notes"),
});

// Cut instructions
export const cutInstructions = pgTable("cut_instructions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  instructions: text("instructions").notNull(),
  estimatedYield: decimal("estimated_yield", { precision: 5, scale: 4 }),
  processingTime: integer("processing_time"), // in minutes
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("medium"), // easy, medium, hard
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory items
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  unitType: varchar("unit_type", { length: 50 }).notNull().default("lbs"), // lbs, packages, cases, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  lowStockAlert: decimal("low_stock_alert", { precision: 10, scale: 2 }).default("0"),
  trackInventory: boolean("track_inventory").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice items
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
});

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  customers: many(customers),
  processingRecords: many(processingRecords),
  cutInstructions: many(cutInstructions),
  inventoryItems: many(inventoryItems),
  invoices: many(invoices),
}));

export const organizationMemberRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  processingRecords: many(processingRecords),
  invoices: many(invoices),
}));

export const processingRecordRelations = relations(processingRecords, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [processingRecords.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [processingRecords.customerId],
    references: [customers.id],
  }),
  species: one(species, {
    fields: [processingRecords.speciesId],
    references: [species.id],
  }),
  animalHeads: many(animalHeads),
}));

export const animalHeadRelations = relations(animalHeads, ({ one }) => ({
  processingRecord: one(processingRecords, {
    fields: [animalHeads.processingRecordId],
    references: [processingRecords.id],
  }),
}));

export const inventoryItemRelations = relations(inventoryItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryItems.organizationId],
    references: [organizations.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [invoiceItems.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export const insertOrganizationSchema = createInsertSchema(organizations);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;
export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers);

export type Species = typeof species.$inferSelect;
export type InsertSpecies = typeof species.$inferInsert;
export const insertSpeciesSchema = createInsertSchema(species);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });

export type ProcessingRecord = typeof processingRecords.$inferSelect;
export type InsertProcessingRecord = typeof processingRecords.$inferInsert;
export const insertProcessingRecordSchema = createInsertSchema(processingRecords).omit({ id: true, createdAt: true, updatedAt: true });

export type AnimalHead = typeof animalHeads.$inferSelect;
export type InsertAnimalHead = typeof animalHeads.$inferInsert;
export const insertAnimalHeadSchema = createInsertSchema(animalHeads).omit({ id: true });

export type CutInstruction = typeof cutInstructions.$inferSelect;
export type InsertCutInstruction = typeof cutInstructions.$inferInsert;
export const insertCutInstructionSchema = createInsertSchema(cutInstructions).omit({ id: true, createdAt: true, updatedAt: true });

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true, updatedAt: true });

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
