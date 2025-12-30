# Quote Keeper - Smart Quote Manager

A full-stack web application that helps you discover, organize, and synchronize meaningful quotes from books and personal collections. Now powered by **React, Firebase Cloud Functions, Firestore, and Firebase Authentication**.

## Features

**Quote Discovery & Management**
- **Smart Random Quote Display**: View random quotes with intelligent weighting that prioritizes unread quotes while avoiding repetition
- **Quote Navigation**: Browse through your quote history with previous/next navigation
- **Read Tracking**: Mark quotes as read and track how many times you've viewed each quote
- **Manual Quote Entry**: Add quotes with metadata including author, source, page number, and custom collections

**Collection Organization**
- **Create Collections**: Organize quotes by source (book, author, website, personal notes)
- **Collection Management**: Edit, delete, and view all quotes within a collection
- **Color-Coded Collections**: Assign custom colors to collections for visual organization
- **Collection Filtering**: View quotes filtered by specific collections

**Kindle Synchronization**
- **Highlight Import**: Sync highlights from your Kindle library
- **Duplicate Prevention**: Automatically detects and skips duplicate highlights
- **Sync History**: Track synchronization metadata including date, number of quotes added, and duplicates found
- **Flexible Import Format**: Support for CSV and plain text formats from Kindle exports

**Authentication & Access Control**
- **Google Sign-In**: Secure authentication using Firebase Authentication
- **Email Whitelist**: Firestore-driven access control - only whitelisted emails can access the application
- **Admin Management**: Administrators can add/remove emails from the whitelist
- **Role-Based Access**: Support for admin and user roles

**User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Theme support for comfortable reading in any environment
- **Dashboard Navigation**: Intuitive sidebar navigation with quick access to all features
- **Real-Time Feedback**: Toast notifications for all user actions

## Technology Stack

**Frontend**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components for consistent design
- Wouter for client-side routing
- tRPC for type-safe API calls

**Backend**
- Firebase Cloud Functions (TypeScript) for serverless API
- tRPC 11 for RPC procedures
- Firebase Admin SDK

**Database**
- Google Cloud Firestore for data persistence

**Authentication**
- Firebase Authentication (Google Sign-In)
- Firebase Admin SDK for backend token verification
- Firestore-based email whitelist

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm (installed with Node.js)
- Firebase CLI (`npm install -g firebase-tools` if you don't have it)
- A Google account for Firebase setup

### Firebase Project Setup (Manual Steps in Firebase Console)

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the instructions.

2.  **Enable Firebase Authentication:**
    *   In your Firebase project, navigate to **Build > Authentication**.
    *   Go to the "Sign-in method" tab and enable the **Google** provider.
    *   **Crucially, add your app's authorized domains.** For local development, add `localhost` and `localhost:5173` (or whatever port your Vite dev server runs on).

3.  **Enable Firestore Database:**
    *   In your Firebase project, navigate to **Build > Firestore Database**.
    *   Click "Create database" and choose "Start in production mode" (you can adjust security rules later).

4.  **Get Frontend Configuration (`firebaseConfig`):**
    *   In Firebase Console > Project Overview, click the Web app icon (`</>`) to add a web app.
    *   Register your app and **copy the `firebaseConfig` object**. You'll add this to your local `.env` file.

5.  **Get Backend Service Account Key (for Local Emulation):**
    *   In Firebase Console > Project settings (gear icon) > "Service accounts" tab.
    *   Click "Generate new private key". A JSON file will be downloaded.
    *   **Save this file securely** (e.g., in your project root, but remember it's in `.gitignore`). You'll use its path as an environment variable for local emulation.

### Installation

1.  **Clone or download the project**
    ```bash
    git clone your-repo-url
    cd quote-keeper
    ```

2.  **Install root dependencies**
    ```bash
    npm install
    ```

3.  **Install Firebase Functions dependencies**
    ```bash
    npm install --prefix functions
    ```

4.  **Set up environment variables**

    Create a `.env` file in the project root with the following (replace placeholders with your actual values):

    ```env
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

    # For local Firebase Functions emulation with admin privileges
    # Replace with the actual path to your downloaded Service Account Key JSON file
    # Example: /home/user/my-project/quotes-vitor-firebase-adminsdk-fbsvc-xxxx.json
    GOOGLE_APPLICATION_CREDENTIALS="YOUR_PATH_TO_SERVICE_ACCOUNT_KEY.json"
    ```
    *   **IMPORTANT:** The `GOOGLE_APPLICATION_CREDENTIALS` variable should point to the absolute path of the JSON file you downloaded. This is only needed for local emulation of Cloud Functions that require Admin SDK privileges.

### Running the Development Server

You'll need two separate terminal windows:

**Terminal 1: Firebase Emulators (Backend)**

1.  **Set the Service Account Key environment variable (for this session):**
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/quotes-vitor-firebase-adminsdk-fbsvc-xxxx.json"
    ```
    (Replace with the actual absolute path to your JSON file)

2.  **Start the Firebase Emulators:**
    ```bash
    npm start
    ```
    This will start the Functions and Firestore emulators. Note the URL for your `api` function (usually `http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/api`). The frontend is pre-configured to use this.

**Terminal 2: Vite Development Server (Frontend)**

1.  **Start the Vite dev server:**
    ```bash
    npm run dev
    ```
    This will compile and serve your React application.

After both are running, open your browser to the address provided by the Vite dev server (e.g., `http://localhost:5173`).

### Initial Setup (After Login)

1.  **Log in with Google:** Click "Sign in with Google" on the login page.
2.  **Add your email to the whitelist (if restricted):** If your application uses an email whitelist for access control, you might need to add your email via the Firebase Console (by manually adding a document to the `whitelist` collection in Firestore with your email as ID) or via an admin interface if implemented.
3.  **Create your first collection:** Navigate to "Collections" and create your first collection to start organizing quotes.

## Managing Email Whitelist

As an admin user, you can manage who has access to the application via the `whitelist` collection in Firestore.

### Adding Emails to Whitelist

Administrators can add emails via the app's interface (if implemented) or directly in Firestore:
1.  Go to Firebase Console > Firestore Database.
2.  Navigate to the `whitelist` collection.
3.  Add a new document with the email address as the Document ID (e.g., `new-user@example.com`).
4.  Optionally add fields like `addedBy` (UID of admin user) and `addedAt` (timestamp).

### Removing Emails from Whitelist

Delete the corresponding document from the `whitelist` collection in Firestore.

## Syncing Kindle Highlights

(Content remains largely the same, but the "Importing into Quote Keeper" section should mention selecting a collection and the format for highlight IDs is handled internally by the new Firestore logic.)

### How to Export Highlights from Kindle

(Existing content is fine)

### Importing into Quote Keeper

1.  **Navigate to Kindle Sync** in the application menu
2.  **Select a target collection** where the quotes will be saved
3.  **Choose import method**:
    -   **Paste directly**: Copy and paste highlights from Kindle Cloud Reader
    -   **Upload file**: Upload a CSV or TXT file exported from your Kindle device
4.  **Format your highlights** (one per line):
    ```
    Quote text here,Author Name,Book Title,Page Number
    "To be or not to be","William Shakespeare","Hamlet",42
    "It was the best of times","Charles Dickens","A Tale of Two Cities",1
    ```
5.  **Click "Sync Highlights"**
6.  The system will automatically:
    -   Detect and skip duplicate highlights (using unique Kindle highlight IDs)
    -   Create new quote entries in your selected collection
    -   Track sync metadata for future reference in the `kindleSyncLog` subcollection under your user document.

### Preventing Duplicates

Quote Keeper uses unique Kindle highlight IDs to prevent duplicates. If you sync the same highlights multiple times, the system will:
-   Recognize previously imported highlights
-   Skip them in the new sync
-   Report the number of duplicates found

This ensures your quote library stays clean and organized without manual duplicate management.

## Development

### Running Tests

```bash
npm test
```

Tests are written with Vitest and cover API procedures.

### Project Structure

```
client/
  src/
    pages/          # Page components (Home, Collections, AddQuote, etc.)
    components/     # Reusable UI components
    lib/            # Firebase client SDK setup, tRPC client setup
    contexts/       # React contexts (theme, auth)
    App.tsx         # Main app routing
functions/
  src/
    # Firebase Cloud Functions code (tRPC backend, Firestore logic)
firebase.json       # Firebase project configuration
.firebaserc         # Firebase project alias
```

## Deployment

To deploy your Firebase Cloud Functions and Firestore rules:

```bash
npm run deploy
```
This command (which executes `firebase deploy`) will deploy your functions, Firestore indexes, and security rules to your Firebase project.

## Troubleshooting

### Firebase Configuration Issues

**Error: `CONFIGURATION_NOT_FOUND` during login**
-   Verify your `VITE_FIREBASE_API_KEY` in `.env` matches the "Web API Key" in Firebase Project Settings.
-   Ensure `localhost` (and specifically `localhost:5173` or your Vite port) is added to the "Authorized domains" list in Firebase Console > Project settings > Authentication > Settings.

**Error: `permission-denied` for Firestore operations**
-   Check your Firestore Security Rules in the Firebase Console. By default, "production mode" rules deny all access. You'll need to write rules that allow authenticated users to read/write their own data.

### Local Emulation Issues

**Error: `GOOGLE_APPLICATION_CREDENTIALS` not set**
-   Ensure you have set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable in your terminal before starting the Firebase Emulators (`npm start`). It must point to the absolute path of your service account JSON file.

### Quotes, Collections, Kindle Sync Errors

-   Ensure the Firebase Emulators (especially Functions and Firestore) are running when you run the frontend.
-   Check the emulator logs for any backend errors during API calls.

## Security Considerations

1.  **Firebase Authentication**: Secure user management.
2.  **Firestore Security Rules**: Crucial for controlling data access. Define rules to ensure users can only read/write their own data (`request.auth.uid == resource.data.userId`).
3.  **Environment Variables**: Never commit sensitive data; use environment variables (`.env`).
4.  **HTTPS**: Firebase automatically enforces HTTPS for deployed functions.

## Contributing

To contribute to Quote Keeper:

1.  Create a feature branch: `git checkout -b feature/your-feature`
2.  Make your changes and write tests
3.  Run tests: `npm test`
4.  Commit with clear messages: `git commit -m "feat: add new feature"`
5.  Push and create a pull request

## License

This project is provided as-is for personal and educational use.

## Support

For issues, questions, or suggestions:
-   Check the troubleshooting section above
-   Review the code comments in key files
-   Examine test files for usage examples

## Roadmap

Future enhancements planned for Quote Keeper:

- **Advanced Search**: Full-text search across all quotes
- **Export Options**: Export quotes as PDF, Markdown, or JSON
- **Sharing**: Share collections with other users
- **Analytics**: Statistics on reading patterns and favorite authors
- **Mobile App**: Native iOS/Android applications
- **AI Integration**: Automatic quote categorization and recommendations
- **Social Features**: Follow other users' collections and recommendations

## Acknowledgments

Quote Keeper is inspired by [Readwise](https://readwise.io/), a powerful tool for managing and discovering highlights from across the web and your Kindle library.

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Author**: Gemini AI