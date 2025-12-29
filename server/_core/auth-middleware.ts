/**
 * Authentication middleware to enforce email whitelist
 * This middleware runs after OAuth callback and before user is granted access
 */
import { isEmailWhitelisted } from "../db";
import { TRPCError } from "@trpc/server";

export async function validateUserEmailAccess(email: string | undefined): Promise<void> {
  if (!email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Email not provided by OAuth provider",
    });
  }

  const isWhitelisted = await isEmailWhitelisted(email);
  if (!isWhitelisted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Email ${email} is not authorized to access this application. Please contact the administrator.`,
    });
  }
}
