import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  titleTr: text("title_tr").notNull(),
  titleEn: text("title_en").notNull(),
  titleFa: text("title_fa").notNull(),
  titleRu: text("title_ru").notNull(),
  descriptionTr: text("description_tr").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionFa: text("description_fa").notNull(),
  descriptionRu: text("description_ru").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // sale | rent
  category: varchar("category", { length: 50 }).notNull(), // villa | apartment | land | commercial
  price: doublePrecision("price").notNull(),
  // Set automatically when an existing property's price is lowered (see
  // updateProperty in dataProvider.ts). Powers the mobile client's real
  // Price Drop Alerts — never a fabricated/display-only discount.
  previousPrice: doublePrecision("previous_price"),
  currency: varchar("currency", { length: 10 }).notNull().default("GBP"),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  area: doublePrecision("area").notNull(), // sqm
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  address: text("address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  agentId: integer("agent_id"),
  // --- Mobile app extensions (Phase 7) ---
  panoramas: jsonb("panoramas").$type<string[]>().notNull().default([]), // 360° equirectangular images
  videos: jsonb("videos").$type<string[]>().notNull().default([]), // video tours (url)
  audioNotes: jsonb("audio_notes").$type<string[]>().notNull().default([]), // voice memos (url)
  documents: jsonb("documents").$type<string[]>().notNull().default([]), // scanned docs / contracts (url)
  virtualTourUrl: text("virtual_tour_url"), // Matterport / external embed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Agents table
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  photo: text("photo"),
  bioTr: text("bio_tr"),
  bioEn: text("bio_en"),
  bioFa: text("bio_fa"),
  bioRu: text("bio_ru"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contact inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Site settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Admin users (legacy single-admin)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Regular users (site visitors)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 50 }),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Staff / Consultant accounts (Phase 7: RBAC) ---
// Links a login identity to the public `agents` record (agentId) when role = consultant.
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("consultant"), // manager | consultant
  agentId: integer("agent_id"), // links to agents.id for public profile
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | disabled
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 50 }),
  pushToken: text("push_token"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Saved searches for notifications
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<{
    type?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
  }>().notNull(),
  emailNotify: boolean("email_notify").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, login, etc.
  entity: varchar("entity", { length: 50 }).notNull(), // property, agent, user, inquiry, etc.
  entityId: integer("entity_id"),
  details: text("details"),
  userId: integer("user_id"),
  userName: text("user_name"),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Newsletter subscribers
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment / Booking deposits
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  userId: integer("user_id"),
  amount: doublePrecision("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("GBP"),
  type: varchar("type", { length: 30 }).notNull(), // deposit, booking_fee, consultation
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }), // stripe, bank_transfer, cash
  transactionId: varchar("transaction_id", { length: 255 }),
  customerName: text("customer_name").notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CRM Leads
export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 50 }).notNull().default("website"), // website, referral, social, ad, direct
  status: varchar("status", { length: 30 }).notNull().default("new"), // new, contacted, qualified, proposal, negotiation, won, lost
  priority: varchar("priority", { length: 10 }).notNull().default("medium"), // low, medium, high, urgent
  propertyInterest: text("property_interest"),
  budget: doublePrecision("budget"),
  assignedAgentId: integer("assigned_agent_id"),
  notes: text("notes"),
  lastContactAt: timestamp("last_contact_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CRM follow-up tasks
export const crmTasks = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, cancelled
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Live Chat
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  visitorName: text("visitor_name"),
  visitorEmail: varchar("visitor_email", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, closed
  assignedAgentId: integer("assigned_agent_id"),
  assignedStaffId: integer("assigned_staff_id"), // staff.id of consultant handling it
  unreadCount: integer("unread_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  sender: varchar("sender", { length: 20 }).notNull(), // visitor | agent | bot | staff
  senderId: integer("sender_id"), // staff.id when sender is a staff member
  senderName: text("sender_name"),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("text"), // text | audio | image
  mediaUrl: text("media_url"), // for audio/image messages
  durationSec: integer("duration_sec"), // for audio messages
  readAt: timestamp("read_at"), // when the recipient has read the message
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Page views tracking
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 500 }).notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  propertyId: integer("property_id"),
  sessionId: varchar("session_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Static content management (CMS)
export const staticContent = pgTable("static_content", {
  id: serial("id").primaryKey(),
  section: varchar("section", { length: 100 }).notNull(), // hero_slides, about, footer, contact, etc.
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(), // JSON string
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Uploaded media (Phase 7 extensions)
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("image"), // image | panorama | video | audio | document
  propertyId: integer("property_id"),
  uploadedById: integer("uploaded_by_id"), // staff.id
  durationSec: integer("duration_sec"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
