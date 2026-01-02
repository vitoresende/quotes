import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as dotenv from "dotenv";
import * as path from "path"; // Import path module

// Load environment variables from .env file for local development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, '../../functions/.env') }); // Ensure correct path for functions .env
}

// Initialize the Firebase Admin SDK.
// When deployed to Firebase, the SDK automatically picks up the configuration.
// For local development, we check if a service account path is provided.
if (process.env.NODE_ENV !== 'production' && process.env.SERVICE_ACCOUNT_PATH) {
  // Ensure the path is absolute for Node.js require/read operations
  const serviceAccountPath = path.resolve(process.cwd(), process.env.SERVICE_ACCOUNT_PATH);
  
  // Use admin.credential.cert with the path; the SDK will handle reading the file
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: (functions.config as any).firebase?.projectId || process.env.FIREBASE_PROJECT_ID, // Use functions config or local env
  });
} else {
  // Use default credential when deployed to Firebase Functions
  admin.initializeApp();
  admin.firestore().settings({ ignoreUndefinedProperties: true });
}

export const firebaseAdmin = admin;
export const firestoreDb = admin.firestore();
