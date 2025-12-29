import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Email whitelist table for access control.
 * Only users with emails in this list can access the application.
 */
export const emailWhitelist = mysqlTable("email_whitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  addedBy: int("addedBy").notNull(), // User ID who added this email
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailWhitelist = typeof emailWhitelist.$inferSelect;
export type InsertEmailWhitelist = typeof emailWhitelist.$inferInsert;

/**
 * Collections table for organizing quotes by source (book, author, personal, etc.)
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the collection
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Quotes table - core content of the application
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the quote
  collectionId: int("collectionId").notNull(), // Reference to collection
  text: text("text").notNull(),
  source: varchar("source", { length: 255 }), // Book title, author, website, etc.
  author: varchar("author", { length: 255 }), // Author name
  pageNumber: int("pageNumber"), // Optional page number from book
  isRead: boolean("isRead").default(false).notNull(), // Track if user has viewed this quote
  readCount: int("readCount").default(0).notNull(), // How many times user viewed this quote
  lastReadAt: timestamp("lastReadAt"), // Last time this quote was viewed
  kindleHighlightId: varchar("kindleHighlightId", { length: 255 }), // Unique ID from Kindle for deduplication
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Kindle sync metadata - track synchronization history
 */
export const kindleSyncLog = mysqlTable("kindle_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  quotesAdded: int("quotesAdded").default(0).notNull(),
  quotesDuplicated: int("quotesDuplicated").default(0).notNull(),
  quotesSkipped: int("quotesSkipped").default(0).notNull(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KindleSyncLog = typeof kindleSyncLog.$inferSelect;
export type InsertKindleSyncLog = typeof kindleSyncLog.$inferInsert;
