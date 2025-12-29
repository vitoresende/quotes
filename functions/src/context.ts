import type { inferAsyncReturnType } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAdmin, firestoreDb } from "./firebase-admin";

/**
 * The user object attached to the TRPC context.
 * This is the decoded Firebase ID token.
 */
export interface FirebaseUser extends DecodedIdToken {
  // You can add custom properties to the user object here if needed
  role?: 'admin' | 'user';
}

export interface TrpcContext {
  user: FirebaseUser | null;
  db: FirebaseFirestore.Firestore;
}

/**
 * Creates the tRPC context for each request.
 * This function verifies the Firebase ID token from the request headers
 * and attaches the decoded user to the context.
 */
export const createContext = async ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): Promise<TrpcContext> => {
  let user: FirebaseUser | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      
      // TODO: Implement logic to check if the user is an admin.
      // For now, we'll assign the role based on a simple check or assume 'user'.
      // This could involve checking a custom claim or a list in the database.
      const role = decodedToken.email === 'admin@example.com' ? 'admin' : 'user';

      user = { ...decodedToken, role };
      
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      // Token is invalid or expired
    }
  }

  return {
    user,
    db: firestoreDb,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
