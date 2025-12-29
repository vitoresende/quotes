import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK.
// When deployed, Firebase automatically provides the necessary configuration.
// For local development, you'll need to point to your service account key
// via the GOOGLE_APPLICATION_CREDENTIALS environment variable.
admin.initializeApp();

export const firebaseAdmin = admin;
export const firestoreDb = admin.firestore();
