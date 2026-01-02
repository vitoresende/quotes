"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestoreDb = exports.firebaseAdmin = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path")); // Import path module
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
        projectId: functions.config.firebase?.projectId || process.env.FIREBASE_PROJECT_ID, // Use functions config or local env
    });
}
else {
    // Use default credential when deployed to Firebase Functions
    admin.initializeApp();
}
exports.firebaseAdmin = admin;
exports.firestoreDb = admin.firestore();
//# sourceMappingURL=firebase-admin.js.map