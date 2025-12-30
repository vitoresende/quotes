"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const firebase_admin_1 = require("./firebase-admin");
/**
 * Creates the tRPC context for each request.
 * This function verifies the Firebase ID token from the request headers
 * and attaches the decoded user to the context.
 */
const createContext = async ({ req, res, }) => {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        try {
            const decodedToken = await firebase_admin_1.firebaseAdmin.auth().verifyIdToken(token);
            // TODO: Implement logic to check if the user is an admin.
            // For now, we'll assign the role based on a simple check or assume 'user'.
            // This could involve checking a custom claim or a list in the database.
            const role = decodedToken.email === 'admin@example.com' ? 'admin' : 'user';
            user = { ...decodedToken, role };
        }
        catch (error) {
            console.error("Error verifying Firebase ID token:", error);
            // Token is invalid or expired
        }
    }
    return {
        user,
        db: firebase_admin_1.firestoreDb,
    };
};
exports.createContext = createContext;
//# sourceMappingURL=context.js.map