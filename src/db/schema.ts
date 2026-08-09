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
  // --- User Listings integration (Phase 8) ---
  isListed: boolean("is_listed").notNull().default(true), // false = hidden from public list
  source: varchar("source", { length: 20 }).notNull().default("staff"), // staff | user_listing
  listingId: integer("listing_id"), // FK to listings.id (added in Section 5 of migration)
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
  // --- Block system (Phase 8: User Listings) ---
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedAt: timestamp("blocked_at"),
  blockedReason: text("blocked_reason"),
  blockedByStaffId: integer("blocked_by_staff_id"),
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

// =============================================================================
// Phase 8: User Listings + Visit Requests + Block System
// =============================================================================

// --- User profiles (extended user info, captured in listing form) ---
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  lastName: text("last_name"),
  nationalId: varchar("national_id", { length: 20 }),
  addressLine: text("address_line"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Turkey"),
  postalCode: varchar("postal_code", { length: 20 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Staff specialties (assignment matching) ---
export const staffSpecialties = pgTable("staff_specialties", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  city: varchar("city", { length: 100 }),
  category: varchar("category", { length: 50 }),
  listingType: varchar("listing_type", { length: 20 }), // sale | rent
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Listings (user-submitted property listings) ---
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  // Listing nature
  listingKinds: jsonb("listing_kinds").$type<("sale" | "rent")[]>().notNull(),
  category: varchar("category", { length: 50 }).notNull(), // villa | apartment | land | commercial
  // Content
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Location
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Turkey"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  // Pricing
  price: doublePrecision("price"), // sale price
  rentDeposit: doublePrecision("rent_deposit"), // rental deposit
  monthlyRent: doublePrecision("monthly_rent"), // monthly rent
  currency: varchar("currency", { length: 10 }).notNull().default("GBP"),
  // Specs
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  area: doublePrecision("area").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  // Media
  images: jsonb("images").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  panoramas: jsonb("panoramas").$type<string[]>().notNull().default([]),
  // Contact (snapshot from profile at submit time)
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  // Moderation
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("pending"),
  // pending | approved | rejected | removed | unavailable_reported
  rejectionReason: text("rejection_reason"),
  assignedStaffId: integer("assigned_staff_id").references(() => staff.id, { onDelete: "set null" }),
  // Removal
  removedByUser: boolean("removed_by_user").notNull().default(false),
  removedAt: timestamp("removed_at"),
  // Unavailability report (block trigger)
  unavailabilityReportedAt: timestamp("unavailability_reported_at"),
  unavailabilityReportNotes: text("unavailability_report_notes"),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// --- Listings status history (audit trail) ---
export const listingsStatusHistory = pgTable("listings_status_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 20 }),
  toStatus: varchar("to_status", { length: 20 }).notNull(),
  changedByUserId: integer("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  changedByStaffId: integer("changed_by_staff_id").references(() => staff.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Notifications (in-app user notifications) ---
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  // listing_approved | listing_rejected | listing_removed | visit_request_status | account_blocked | account_unblocked
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, any>>(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Visit requests (visit booking workflow) ---
export const visitRequests = pgTable("visit_requests", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  requesterUserId: integer("requester_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Requester info (snapshot)
  requesterName: text("requester_name").notNull(),
  requesterPhone: text("requester_phone").notNull(),
  requesterEmail: text("requester_email"),
  preferredDate: timestamp("preferred_date"),
  note: text("note"),
  // Workflow
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending | staff_reviewing | owner_contacted | approved | rejected | completed | cancelled
  staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
  // Owner contact result
  ownerResponse: varchar("owner_response", { length: 20 }), // available | unavailable | no_response
  ownerResponseNote: text("owner_response_note"),
  contactedAt: timestamp("contacted_at"),
  // Appointment
  appointmentDate: timestamp("appointment_date"),
  appointmentNotes: text("appointment_notes"),
  // Notification tracking
  requesterNotifiedAt: timestamp("requester_notified_at"),
  unavailabilityReported: boolean("unavailability_reported").notNull().default(false),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Reassignment requests (staff-initiated reassign workflow) ---
export const reassignmentRequests = pgTable("reassignment_requests", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  requestedByStaffId: integer("requested_by_staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  preferredStaffId: integer("preferred_staff_id").references(() => staff.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
  resolvedByStaffId: integer("resolved_by_staff_id").references(() => staff.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
