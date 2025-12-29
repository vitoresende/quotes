import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, emailWhitelist, collections, quotes, kindleSyncLog, InsertQuote, InsertCollection, InsertEmailWhitelist, InsertKindleSyncLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Check if an email is whitelisted
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(emailWhitelist)
    .where(eq(emailWhitelist.email, email.toLowerCase()))
    .limit(1);

  return result.length > 0;
}

/**
 * Add email to whitelist (admin only)
 */
export async function addEmailToWhitelist(email: string, addedBy: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailWhitelist).values({
    email: email.toLowerCase(),
    addedBy,
  });
}

/**
 * Remove email from whitelist (admin only)
 */
export async function removeEmailFromWhitelist(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(emailWhitelist).where(eq(emailWhitelist.email, email.toLowerCase()));
}

/**
 * Get all whitelisted emails
 */
export async function getAllWhitelistedEmails(): Promise<typeof emailWhitelist.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(emailWhitelist);
}

/**
 * Create a new collection
 */
export async function createCollection(data: InsertCollection): Promise<typeof collections.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(collections).values(data);
  const id = Number(result[0].insertId);
  
  const created = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  return created[0]!;
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(userId: number): Promise<typeof collections.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(collections).where(eq(collections.userId, userId));
}

/**
 * Get a specific collection
 */
export async function getCollection(id: number): Promise<typeof collections.$inferSelect | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  return result[0];
}

/**
 * Update a collection
 */
export async function updateCollection(id: number, data: Partial<InsertCollection>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(collections).set(data).where(eq(collections.id, id));
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(collections).where(eq(collections.id, id));
}

/**
 * Create a new quote
 */
export async function createQuote(data: InsertQuote): Promise<typeof quotes.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quotes).values(data);
  const id = Number(result[0].insertId);
  
  const created = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return created[0]!;
}

/**
 * Get all quotes for a user
 */
export async function getUserQuotes(userId: number): Promise<typeof quotes.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
}

/**
 * Get quotes by collection
 */
export async function getQuotesByCollection(userId: number, collectionId: number): Promise<typeof quotes.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), eq(quotes.collectionId, collectionId)))
    .orderBy(desc(quotes.createdAt));
}

/**
 * Get a specific quote
 */
export async function getQuote(id: number): Promise<typeof quotes.$inferSelect | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result[0];
}

/**
 * Update a quote
 */
export async function updateQuote(id: number, data: Partial<InsertQuote>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(quotes).set(data).where(eq(quotes.id, id));
}

/**
 * Delete a quote
 */
export async function deleteQuote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(quotes).where(eq(quotes.id, id));
}

/**
 * Mark quote as read and increment read count
 */
export async function markQuoteAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const quote = await getQuote(id);
  if (!quote) throw new Error("Quote not found");

  await db.update(quotes).set({
    isRead: true,
    readCount: (quote.readCount || 0) + 1,
    lastReadAt: new Date(),
  }).where(eq(quotes.id, id));
}

/**
 * Check if a Kindle highlight already exists (for deduplication)
 */
export async function getQuoteByKindleHighlightId(userId: number, kindleHighlightId: string): Promise<typeof quotes.$inferSelect | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), eq(quotes.kindleHighlightId, kindleHighlightId)))
    .limit(1);

  return result[0];
}

/**
 * Log Kindle sync activity
 */
export async function logKindleSync(data: InsertKindleSyncLog): Promise<typeof kindleSyncLog.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(kindleSyncLog).values(data);
  const id = Number(result[0].insertId);
  
  const created = await db.select().from(kindleSyncLog).where(eq(kindleSyncLog.id, id)).limit(1);
  return created[0]!;
}

/**
 * Get latest sync log for a user
 */
export async function getLatestSyncLog(userId: number): Promise<typeof kindleSyncLog.$inferSelect | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(kindleSyncLog)
    .where(eq(kindleSyncLog.userId, userId))
    .orderBy(desc(kindleSyncLog.syncedAt))
    .limit(1);

  return result[0];
}
