# YouTube Companion Dashboard

A comprehensive full-stack web application for managing YouTube videos, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Video Management**: View and edit video details, statistics, and metadata
- **Comment Management**: Read, create, reply to, and delete comments
- **Notes System**: Take and organize searchable notes with tagging
- **Event Logging**: Track all user interactions for audit purposes
- **Secure Authentication**: Google OAuth integration with NextAuth.js

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **API Integration**: YouTube Data API v3

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Console project with YouTube Data API enabled
- Google OAuth credentials

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd youtube-companion-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YOUTUBE_API_KEY=your-youtube-api-key
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

### Development

1. Run the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── config.ts          # Application configuration
└── ...
```

## API Endpoints

### Authentication
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/signin` - Sign in with Google OAuth
- `POST /api/auth/signout` - Sign out current user

### Notes Management
- `GET /api/notes` - Get all notes for authenticated user
- `POST /api/notes` - Create a new note
- `GET /api/notes/[noteId]` - Get specific note by ID
- `PUT /api/notes/[noteId]` - Update specific note
- `DELETE /api/notes/[noteId]` - Delete specific note
- `GET /api/notes/search` - Search notes with query parameters
- `GET /api/notes/suggestions` - Get note suggestions based on content
- `GET /api/notes/tags` - Get all available tags

### YouTube Integration
- `GET /api/youtube/videos/[videoId]` - Get YouTube video details
- `GET /api/youtube/videos/[videoId]/comments` - Get video comments
- `POST /api/youtube/videos/[videoId]/comments` - Add comment to video
- `DELETE /api/youtube/comments/[commentId]` - Delete comment
- `GET /api/youtube/channels/[channelId]` - Get channel information

### Event Logging & Analytics
- `GET /api/events` - Get event logs (paginated, filtered)
- `GET /api/events/analytics` - Get event analytics and statistics
- `POST /api/events/track` - Track client-side events

### User Management
- `GET /api/user/profile` - Get user profile information
- `PUT /api/user/profile` - Update user profile

## Database Schema

### Core Models

#### User
```sql
User {
  id          String   @id @default(cuid())
  name        String?
  email       String   @unique
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  accounts    Account[]
  sessions    Session[]
  notes       Note[]
  eventLogs   EventLog[]
}
```

#### Note
```sql
Note {
  id          String   @id @default(cuid())
  title       String
  content     String
  tags        String[] @default([])
  videoId     String?
  timestamp   Float?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([userId])
  @@index([videoId])
  @@index([createdAt])
}
```

#### EventLog
```sql
EventLog {
  id          String   @id @default(cuid())
  eventType   String   // Enum: video_viewed, note_created, search_performed, etc.
  entityType  String   // Enum: user, video, note, comment, page, button, etc.
  entityId    String
  metadata    Json     @default("{}")
  timestamp   DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  userId      String
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([userId])
  @@index([eventType])
  @@index([entityType])
  @@index([timestamp])
  @@index([userId, timestamp])
}
```

### Event Types

#### Video Events
- `video_viewed` - Video was viewed/loaded
- `video_played` - Video playback started
- `video_paused` - Video playback paused
- `video_seeked` - Video timeline was seeked

#### Note Events
- `note_created` - New note was created
- `note_updated` - Existing note was modified
- `note_deleted` - Note was deleted

#### Search Events
- `search_performed` - Search query was executed
- `search_suggestion_clicked` - Search suggestion was selected

#### UI Events
- `page_view` - Page was visited
- `button_click` - Button was clicked
- `form_submit` - Form was submitted
- `modal_open` - Modal dialog was opened
- `modal_close` - Modal dialog was closed

#### Error Events
- `api_error` - Server-side API error occurred
- `client_error` - Client-side JavaScript error
- `network_error` - Network connectivity issue

### Entity Types
- `user` - User-related events
- `video` - YouTube video-related events
- `note` - Note-related events
- `comment` - Comment-related events
- `page` - Page navigation events
- `button` - UI button interactions
- `form` - Form interactions
- `modal` - Modal dialog events
- `search` - Search-related events
- `system` - System/application events

## Environment Variables

| Variable               | Description                | Required |
| ---------------------- | -------------------------- | -------- |
| `NEXTAUTH_URL`         | Application URL            | Yes      |
| `NEXTAUTH_SECRET`      | NextAuth.js secret key     | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | Yes      |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes      |
| `YOUTUBE_API_KEY`      | YouTube Data API key       | Yes      |
| `DATABASE_URL`         | Database connection string | Yes      |

## API Setup

### Google Cloud Console Setup

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the YouTube Data API v3
3. Create credentials (API key for YouTube API)
4. Create OAuth 2.0 credentials for web application
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### YouTube API Scopes

The application requires the following YouTube API scopes:

- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/youtube.force-ssl`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
