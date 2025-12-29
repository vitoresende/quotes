# Quote Keeper - Smart Quote Manager

A full-stack web application inspired by Readwise that helps you discover, organize, and synchronize meaningful quotes from books and personal collections. Built with React, Express, tRPC, and a modern tech stack with Google Sign-In authentication and email whitelist access control.

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
- **Google Sign-In**: Secure authentication using Google OAuth
- **Email Whitelist**: Database-driven access control - only whitelisted emails can access the application
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
- Express 4 for HTTP server
- tRPC 11 for RPC procedures
- Node.js with TypeScript

**Database**
- MySQL/TiDB for data persistence
- Drizzle ORM for type-safe database operations
- Automatic migrations with drizzle-kit

**Authentication**
- Manus OAuth for Google Sign-In
- JWT-based session management
- Email whitelist validation middleware

## Quick Start

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm 10.4.1 or higher
- A Google account for OAuth setup
- MySQL/TiDB database connection string

### Installation

1. **Clone or download the project**
   ```bash
   cd readwise-clone
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   The following environment variables are automatically provided by the platform:
   - `DATABASE_URL`: Your MySQL/TiDB connection string
   - `JWT_SECRET`: Session signing secret
   - `VITE_APP_ID`: OAuth application ID
   - `OAUTH_SERVER_URL`: OAuth server URL
   - `VITE_OAUTH_PORTAL_URL`: OAuth portal URL
   - `OWNER_OPEN_ID`: Owner's OAuth identifier
   - `OWNER_NAME`: Owner's name

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```
   
   This command generates and applies database migrations based on your schema.

5. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   The application will be available at `http://localhost:3000`

6. **Build for production**
   ```bash
   pnpm build
   ```
   
   This creates optimized production builds in the `dist` directory.

### Initial Setup

1. **Add your email to the whitelist**
   
   Since the application uses email whitelist access control, you need to add your email to the database before you can log in. As the application owner, you have admin privileges by default.
   
   Connect to your database and add your email:
   ```sql
   INSERT INTO email_whitelist (email, addedBy, createdAt, updatedAt) 
   VALUES ('your-email@example.com', 1, NOW(), NOW());
   ```

2. **Log in with Google**
   
   Click "Sign in with Google" on the login page and authenticate with your Google account associated with the whitelisted email.

3. **Create your first collection**
   
   Once logged in, navigate to "Collections" and create your first collection to start organizing quotes.

## Syncing Kindle Highlights

### How to Export Highlights from Kindle

Kindle provides multiple ways to export your highlights. Here are the most straightforward methods:

#### Method 1: From Kindle Cloud Reader (Recommended)

1. Go to [read.amazon.com](https://read.amazon.com)
2. Log in with your Amazon account
3. Open any book you've highlighted
4. Click the "Notes" tab at the top
5. You'll see all your highlights listed
6. Select and copy the highlights you want to export
7. Paste them into a text file or directly into Quote Keeper

#### Method 2: From Kindle Device or App

**On Kindle E-Readers (Paperwhite, Oasis, etc.):**
1. Open the book containing your highlights
2. Tap the top of the screen
3. Select the "Notebook" or "Notes" icon
4. Tap "Export Notes" at the bottom
5. Choose email as the export destination
6. You'll receive a CSV or PDF file with your highlights

**On Kindle Mobile App (iOS/Android):**
1. Open the book in the Kindle app
2. Tap the screen center to show the menu
3. Select the "Notebook" icon
4. Tap the menu (three dots) in the top-right corner
5. Select "Export Notebook"
6. Choose your export format (CSV or PDF)
7. Select email destination

#### Method 3: Using Third-Party Tools

Several services can help export Kindle highlights:
- **Glasp**: Browser extension for highlighting and exporting (supports CSV, TXT, MD)
- **Clippings.io**: Web service for exporting Kindle highlights
- **Bookcision**: Bookmarklet for extracting highlights from Kindle Cloud Reader

### Importing into Quote Keeper

1. **Navigate to Kindle Sync** in the application menu
2. **Select a target collection** where the quotes will be saved
3. **Choose import method**:
   - **Paste directly**: Copy and paste highlights from Kindle Cloud Reader
   - **Upload file**: Upload a CSV or TXT file exported from your Kindle device
4. **Format your highlights** (one per line):
   ```
   Quote text here,Author Name,Book Title,Page Number
   "To be or not to be","William Shakespeare","Hamlet",42
   "It was the best of times","Charles Dickens","A Tale of Two Cities",1
   ```
5. **Click "Sync Highlights"**
6. The system will automatically:
   - Detect and skip duplicate highlights (using unique Kindle highlight IDs)
   - Create new quote entries in your selected collection
   - Track sync metadata for future reference

### Preventing Duplicates

Quote Keeper uses unique Kindle highlight IDs to prevent duplicates. If you sync the same highlights multiple times, the system will:
- Recognize previously imported highlights
- Skip them in the new sync
- Report the number of duplicates found

This ensures your quote library stays clean and organized without manual duplicate management.

## Managing Email Whitelist

As an admin user, you can manage who has access to the application:

### Adding Emails to Whitelist

1. Go to the application settings (if available in your deployment)
2. Navigate to the "Whitelist" section
3. Enter the email address you want to allow
4. Click "Add Email"

Alternatively, add directly to the database:
```sql
INSERT INTO email_whitelist (email, addedBy, createdAt, updatedAt) 
VALUES ('new-user@example.com', 1, NOW(), NOW());
```

### Removing Emails from Whitelist

1. Go to the "Whitelist" section in settings
2. Find the email you want to remove
3. Click "Remove"

Or via database:
```sql
DELETE FROM email_whitelist WHERE email = 'user@example.com';
```

## Database Schema

### Users Table
Stores authenticated user information with OAuth integration.

### Email Whitelist Table
Controls which emails are allowed to access the application.

### Collections Table
Organizes quotes by source, author, theme, or custom categories.

### Quotes Table
Core content table storing quote text, metadata, and read tracking.

### Kindle Sync Log Table
Tracks synchronization history and statistics.

## Development

### Running Tests

```bash
pnpm test
```

Tests are written with Vitest and cover authentication, quote management, and API procedures.

### Database Migrations

When you modify the schema in `drizzle/schema.ts`:

```bash
pnpm db:push
```

This command:
1. Generates migration files
2. Applies migrations to your database
3. Updates generated types

### Project Structure

```
client/
  src/
    pages/          # Page components (Home, Collections, AddQuote, etc.)
    components/     # Reusable UI components
    lib/            # tRPC client setup
    contexts/       # React contexts (theme, auth)
    App.tsx         # Main app routing
drizzle/
  schema.ts         # Database schema definitions
server/
  routers.ts        # tRPC procedure definitions
  db.ts             # Database query helpers
  _core/            # Core framework files (auth, context, etc.)
```

## Deployment

### Deploying to Production

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Set production environment variables**
   
   Ensure all required environment variables are set in your production environment:
   - `DATABASE_URL`: Production database connection
   - `JWT_SECRET`: Strong random secret for sessions
   - `NODE_ENV`: Set to "production"
   - All OAuth-related variables

3. **Start the production server**
   ```bash
   pnpm start
   ```

4. **Configure reverse proxy** (nginx/Apache)
   
   Route all requests to the Express server running on port 3000:
   ```nginx
   location / {
     proxy_pass http://localhost:3000;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_cache_bypass $http_upgrade;
   }
   ```

### Deployment Platforms

The application can be deployed to:
- **Vercel**: Optimized for Node.js applications
- **Heroku**: Simple deployment with environment variables
- **DigitalOcean App Platform**: Full control with app specs
- **AWS EC2**: Traditional VPS deployment
- **Docker**: Containerized deployment with Docker Compose

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t quote-keeper .
docker run -p 3000:3000 -e DATABASE_URL="..." quote-keeper
```

## Troubleshooting

### Database Connection Issues

**Error: "Cannot connect to database"**
- Verify `DATABASE_URL` is correct and accessible
- Ensure database user has proper permissions
- Check firewall rules allow connections

### OAuth Login Fails

**Error: "Email not authorized"**
- Verify your email is added to the email whitelist
- Check that the email matches exactly (case-insensitive)
- Contact an admin to add your email

### Kindle Sync Issues

**Error: "No valid highlights found"**
- Verify highlights are formatted correctly (one per line)
- Ensure highlight text is not empty
- Check that you've selected a valid collection

**Duplicates not being detected**
- Ensure you're using the same Kindle export format
- Verify Kindle highlight IDs are included in the export
- Check sync logs for previous sync dates

## Performance Optimization

### Frontend
- Code splitting with React lazy loading
- Optimized bundle size with tree-shaking
- Responsive images and lazy loading

### Backend
- Database query optimization with Drizzle ORM
- Connection pooling for database
- Caching of frequently accessed data

### Database
- Indexes on frequently queried columns (userId, collectionId, kindleHighlightId)
- Proper foreign key relationships
- Regular maintenance and optimization

## Security Considerations

1. **Email Whitelist**: Only whitelisted emails can access the application
2. **JWT Sessions**: Secure cookie-based sessions with JWT signing
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit sensitive data; use environment variables
5. **SQL Injection**: Protected by Drizzle ORM parameterized queries
6. **CORS**: Configure appropriate CORS headers for your domain

## Contributing

To contribute to Quote Keeper:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and write tests
3. Run tests: `pnpm test`
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push and create a pull request

## License

This project is provided as-is for personal and educational use.

## Support

For issues, questions, or suggestions:
- Check the troubleshooting section above
- Review the code comments in key files
- Examine test files for usage examples

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
**Last Updated**: November 2025  
**Author**: Manus AI
