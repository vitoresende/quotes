import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

vi.mock("./db");

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user?: AuthenticatedUser): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: user || defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any as TrpcContext["res"],
  };
}

describe("quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns all quotes for authenticated user", async () => {
      const mockQuotes = [
        {
          id: 1,
          userId: 1,
          collectionId: 1,
          text: "Quote 1",
          source: "Book 1",
          author: "Author 1",
          pageNumber: 10,
          isRead: false,
          readCount: 0,
          lastReadAt: null,
          kindleHighlightId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserQuotes).mockResolvedValue(mockQuotes);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quotes.list();

      expect(result).toEqual(mockQuotes);
      expect(db.getUserQuotes).toHaveBeenCalledWith(1);
    });
  });

  describe("create", () => {
    it("creates a quote for authenticated user", async () => {
      const mockCollection = {
        id: 1,
        userId: 1,
        name: "Test Collection",
        description: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuote = {
        id: 1,
        userId: 1,
        collectionId: 1,
        text: "New Quote",
        source: "Test Book",
        author: "Test Author",
        pageNumber: 42,
        isRead: false,
        readCount: 0,
        lastReadAt: null,
        kindleHighlightId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getCollection).mockResolvedValue(mockCollection);
      vi.mocked(db.createQuote).mockResolvedValue(mockQuote);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quotes.create({
        collectionId: 1,
        text: "New Quote",
        source: "Test Book",
        author: "Test Author",
        pageNumber: 42,
      });

      expect(result).toEqual(mockQuote);
      expect(db.createQuote).toHaveBeenCalledWith({
        userId: 1,
        collectionId: 1,
        text: "New Quote",
        source: "Test Book",
        author: "Test Author",
        pageNumber: 42,
      });
    });

    it("throws error if collection not found", async () => {
      vi.mocked(db.getCollection).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.quotes.create({
          collectionId: 999,
          text: "New Quote",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });

    it("throws error if collection belongs to different user", async () => {
      const mockCollection = {
        id: 1,
        userId: 999,
        name: "Other User's Collection",
        description: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getCollection).mockResolvedValue(mockCollection);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.quotes.create({
          collectionId: 1,
          text: "New Quote",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getRandom", () => {
    it("returns a random quote with smart weighting", async () => {
      const mockQuotes = [
        {
          id: 1,
          userId: 1,
          collectionId: 1,
          text: "Unread Quote",
          source: "Book",
          author: "Author",
          pageNumber: null,
          isRead: false,
          readCount: 0,
          lastReadAt: null,
          kindleHighlightId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          collectionId: 1,
          text: "Read Quote",
          source: "Book",
          author: "Author",
          pageNumber: null,
          isRead: true,
          readCount: 5,
          lastReadAt: new Date(),
          kindleHighlightId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserQuotes).mockResolvedValue(mockQuotes);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quotes.getRandom();

      expect(result).toBeDefined();
      expect([1, 2]).toContain(result?.id);
    });

    it("returns null if no quotes exist", async () => {
      vi.mocked(db.getUserQuotes).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quotes.getRandom();

      expect(result).toBeNull();
    });
  });

  describe("markAsRead", () => {
    it("marks quote as read and increments read count", async () => {
      const mockQuote = {
        id: 1,
        userId: 1,
        collectionId: 1,
        text: "Quote",
        source: "Book",
        author: "Author",
        pageNumber: null,
        isRead: false,
        readCount: 2,
        lastReadAt: null,
        kindleHighlightId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getQuote).mockResolvedValue(mockQuote);
      vi.mocked(db.markQuoteAsRead).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quotes.markAsRead({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.markQuoteAsRead).toHaveBeenCalledWith(1);
    });

    it("throws error if quote not found", async () => {
      vi.mocked(db.getQuote).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.quotes.markAsRead({ id: 999 });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});
