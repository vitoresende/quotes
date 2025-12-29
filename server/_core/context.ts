import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { validateUserEmailAccess } from "./auth-middleware";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    // Validate that user's email is whitelisted
    if (user && user.email) {
      await validateUserEmailAccess(user.email);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    // Email whitelist validation errors will be thrown and handled by tRPC
    if (error instanceof Error && error.message.includes("not authorized")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("FORBIDDEN")) {
      throw error;
    }
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
