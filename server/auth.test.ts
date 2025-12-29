import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  isEmailWhitelisted: vi.fn(),
  addEmailToWhitelist: vi.fn(),
  removeEmailFromWhitelist: vi.fn(),
  getAllWhitelistedEmails: vi.fn(),
  createCollection: vi.fn(),
  getUserCollections: vi.fn(),
  getCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  createQuote: vi.fn(),
  getUserQuotes: vi.fn(),
  getQuotesByCollection: vi.fn(),
  getQuote: vi.fn(),
  updateQuote: vi.fn(),
  deleteQuote: vi.fn(),
  markQuoteAsRead: vi.fn(),
  getQuoteByKindleHighlightId: vi.fn(),
  logKindleSync: vi.fn(),
  getLatestSyncLog: vi.fn(),
}));

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user?: AuthenticatedUser | null): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: user !== undefined ? user : defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth", () => {
  describe("logout", () => {
    it("clears the session cookie and reports success", async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
      expect(clearedCookies[0]?.options).toMatchObject({
        maxAge: -1,
        secure: true,
        sameSite: "none",
        httpOnly: true,
        path: "/",
      });
    });
  });

  describe("checkEmailAccess", () => {
    it("returns allowed: true for whitelisted email", async () => {
      vi.mocked(db.isEmailWhitelisted).mockResolvedValue(true);

      const { ctx } = createAuthContext(null);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.checkEmailAccess({ email: "allowed@example.com" });

      expect(result).toEqual({ allowed: true });
      expect(db.isEmailWhitelisted).toHaveBeenCalledWith("allowed@example.com");
    });

    it("returns allowed: false for non-whitelisted email", async () => {
      vi.mocked(db.isEmailWhitelisted).mockResolvedValue(false);

      const { ctx } = createAuthContext(null);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.checkEmailAccess({ email: "notallowed@example.com" });

      expect(result).toEqual({ allowed: false });
      expect(db.isEmailWhitelisted).toHaveBeenCalledWith("notallowed@example.com");
    });

    it("rejects invalid email format", async () => {
      const { ctx } = createAuthContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.checkEmailAccess({ email: "invalid-email" });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("me", () => {
    it("returns current user when authenticated", async () => {
      const user: AuthenticatedUser = {
        id: 42,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        lastSignedIn: new Date("2024-01-03"),
      };

      const { ctx } = createAuthContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toEqual(user);
    });

    it("returns null when not authenticated", async () => {
      const { ctx } = createAuthContext(null);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });
});

describe("whitelist (admin only)", () => {
  describe("getAll", () => {
    it("returns all whitelisted emails for admin", async () => {
      const mockEmails = [
        { id: 1, email: "admin@example.com", addedBy: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, email: "user@example.com", addedBy: 1, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(db.getAllWhitelistedEmails).mockResolvedValue(mockEmails);

      const adminUser: AuthenticatedUser = {
        id: 1,
        openId: "admin",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const { ctx } = createAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whitelist.getAll();

      expect(result).toEqual(mockEmails);
    });

    it("throws FORBIDDEN for non-admin users", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.whitelist.getAll();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("add", () => {
    it("adds email to whitelist for admin", async () => {
      vi.mocked(db.addEmailToWhitelist).mockResolvedValue(undefined);

      const adminUser: AuthenticatedUser = {
        id: 1,
        openId: "admin",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const { ctx } = createAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whitelist.add({ email: "newuser@example.com" });

      expect(result).toEqual({ success: true });
      expect(db.addEmailToWhitelist).toHaveBeenCalledWith("newuser@example.com", 1);
    });

    it("throws FORBIDDEN for non-admin users", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.whitelist.add({ email: "newuser@example.com" });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("remove", () => {
    it("removes email from whitelist for admin", async () => {
      vi.mocked(db.removeEmailFromWhitelist).mockResolvedValue(undefined);

      const adminUser: AuthenticatedUser = {
        id: 1,
        openId: "admin",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const { ctx } = createAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whitelist.remove({ email: "olduser@example.com" });

      expect(result).toEqual({ success: true });
      expect(db.removeEmailFromWhitelist).toHaveBeenCalledWith("olduser@example.com");
    });

    it("throws FORBIDDEN for non-admin users", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.whitelist.remove({ email: "olduser@example.com" });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
