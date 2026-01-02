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
- Firebase Cloud Functions (TypeScript, 2nd Gen) for serverless API
- tRPC 11 for RPC procedures
- Firebase Admin SDK

**Database**
- Google Cloud Firestore for data persistence

**Authentication**
- Firebase Authentication (Google Sign-In)
- Firebase Admin SDK for backend token verification
- Firestore-based email whitelist

## Setup & Local Development

This project is configured to run the local frontend development server while connecting directly to the **live** Firebase backend services (Firestore, Auth, and the deployed Cloud Function). This simplifies the local setup by removing the need for Firebase emulators.

### Prerequisites

- Node.js 20 or higher
- npm (installed with Node.js)
- Firebase CLI (`npm install -g firebase-tools` if you don't have it)

### 1. Firebase Project Setup

Before running the application, you need a Firebase project to serve as the backend.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication:** In your project, go to **Build > Authentication > Sign-in method** and enable the **Google** provider.
3.  **Enable Firestore:** Go to **Build > Firestore Database** and create a database. Start in "production mode".

### 2. Installation & Configuration

1.  **Clone the repository**
    ```bash
    git clone your-repo-url
    cd your-repo-folder
    ```

2.  **Install dependencies** (for both root and functions)
    ```bash
    npm install
    npm install --prefix functions
    ```

3.  **Set up Environment Variables**

    Create a file named `.env` in the root of the project. This file will hold the configuration for the frontend to connect to your Firebase project.

    ```env
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    ```
    *To find these values, go to your Firebase Console > Project Settings (gear icon) > General, scroll down to "Your apps", and select your web app to see the `firebaseConfig` object.*

### 3. Running Locally

With the setup complete, you only need one command to run the frontend:

```bash
npm dev
```
This will start the Vite development server (e.g., at `http://localhost:5173`). Your application will be running here and communicating with your live Firebase backend. **There is no need to run `npm start` or use emulators.**

## Deployment

The backend logic resides in a Firebase Function that needs to be deployed.

### Step 1: Deploy the Function

Ensure you are in the **root directory** of the project, then run:

```bash
firebase deploy --only functions
```
This command compiles the TypeScript code in the `functions` directory (by automatically running `npm run build` inside it) and deploys it to your Firebase project.

### Step 2: Post-Deployment Configuration (Crucial!)

By default, newly deployed functions are **private** and cannot be accessed from a public website, which results in a CORS or Authentication error. You must make the function public.

1.  **Go to the Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com/)
2.  **Navigate to Cloud Run**: Use the search bar or the navigation menu.
3.  **Select the `api` service**: This is your newly deployed function.
4.  **Go to the "SECURITY" tab**.
5.  Under **Authentication**, select **"Allow unauthenticated invocations"**.
6.  Click **"SAVE"**.

After a moment, your deployed function will be publicly accessible, and your frontend application will be able to communicate with it.

## Troubleshooting

### Firebase Configuration Issues

**Error: `CONFIGURATION_NOT_FOUND` during login**
-   Verify your `VITE_FIREBASE_API_KEY` in `.env` matches the "Web API Key" in Firebase Project Settings.
-   Ensure `localhost` (and specifically `localhost:5173` or your Vite port) is added to the "Authorized domains" list in Firebase Console > Authentication > Settings.

**Error: `permission-denied` for Firestore operations**
-   Check your Firestore Security Rules in the Firebase Console. You will need to write rules that allow authenticated users to read/write their own data.

### Deployment Issues

**Error: CORS or 403 Forbidden after deploy**
-   This is almost always because the function is private. Follow the "Post-Deployment Configuration" steps above to allow unauthenticated invocations.

**Error: `Could not detect runtime...`**
-   Ensure you are running the `firebase deploy` command from the **root directory** of the project, not from inside the `functions` directory.

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