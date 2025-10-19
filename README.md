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
- `GET /api/auth/session` - Get current user session (NextAuth)
- `POST /api/auth/signin` - Sign in with Google OAuth (NextAuth)
- `POST /api/auth/signout` - Sign out current user (NextAuth)

### Health
- `GET /api/health` - Health check with auth and environment status

### User
- `GET /api/user` - Get authenticated user summary and access token status
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update display name or username

### Notes
- `GET /api/notes` - List notes with search and pagination
  - Query: `query`, `tags` (comma-separated), `videoId`, `page`, `limit` (≤100), `orderBy` (`createdAt`|`updatedAt`|`content`), `orderDirection` (`asc`|`desc`)
- `POST /api/notes` - Create note
  - Body: `videoId` (string), `content` (string), `tags` (string[] optional)
- `GET /api/notes/[noteId]` - Get note by ID
- `PUT /api/notes/[noteId]` - Update content, tags, or videoId
- `DELETE /api/notes/[noteId]` - Delete note
- `GET /api/notes/search` - Enhanced search with relevance and highlights
  - Query: `query`, `tags`, `videoId`, `page`, `limit` (≤100), `orderBy` (`createdAt`|`updatedAt`|`content`|`relevance`), `orderDirection`, `includeHighlights` (boolean)
- `GET /api/notes/suggestions` - Search suggestions
  - Query: `query` (required), `limit` (≤20), `type` (`content`|`tags`|`both`)
- `GET /api/notes/tags` - All unique tags for user

### YouTube
- `GET /api/youtube/video?id=...` - Public video details by ID (no auth)
- `GET /api/youtube/video/[videoId]` - Authenticated video details with ownership validation
- `PUT /api/youtube/video/[videoId]/update` - Update video title/description (auth)
- `GET /api/youtube/videos` - Authenticated user's videos (`maxResults` 1–50, `pageToken`)
- `GET /api/youtube/channel` - Authenticated user's channel info
- `GET /api/youtube/comments?id=...` - Public comments for a video (`maxResults`, `pageToken`)
- `POST /api/youtube/comments` - Post comment or reply (auth)
- `DELETE /api/youtube/comments/[commentId]` - Delete comment (auth)

### Events
- `GET /api/events` - Event logs with filters and pagination
  - Query: `page`, `limit`, `eventType`, `entityType`, `entityId`, `startDate`, `endDate`, `orderBy`, `orderDirection`
- `GET /api/events/analytics` - Summary, timeline, top events, recent activity
  - Query: `period` (`day`|`week`|`month`|`year`), `startDate`, `endDate`, `groupBy`
- `GET /api/events/stats` - Aggregated counts per `eventType`
- `POST /api/events/track` - Track an event (auth)
  - Body: `eventType`, `entityType`, `entityId`, optional `metadata`

## Database Schema

### Core Models

Dev (SQLite)
```prisma
model User {
  id          String   @id @default(cuid())
  name        String?
  displayName String?
  username    String?
  email       String   @unique
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  accounts    Account[]
  sessions    Session[]
  notes       Note[]
  eventLogs   EventLog[]

  @@map("users")
}

model Note {
  id        String   @id @default(cuid())
  videoId   String
  content   String
  tags      String   // JSON string for SQLite
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([videoId])
  @@index([userId])
  @@index([content])
  @@index([tags])
  @@index([userId, videoId])
  @@index([userId, createdAt])
  @@map("notes")
}

model EventLog {
  id         String   @id @default(cuid())
  eventType  String
  entityType String
  entityId   String
  metadata   String?  // JSON string for SQLite
  timestamp  DateTime @default(now())
  ipAddress  String?
  userAgent  String?
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@map("event_logs")
}
```

Prod (PostgreSQL)
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  image        String?
  googleId     String   @unique
  accessToken  String?
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  notes        Note[]
  eventLogs    EventLog[]

  @@map("users")
}

model Note {
  id        String   @id @default(cuid())
  videoId   String
  content   String
  tags      String[] // PostgreSQL array
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([videoId])
  @@index([userId])
  @@map("notes")
}

model EventLog {
  id         String   @id @default(cuid())
  eventType  String
  entityType String
  entityId   String
  metadata   Json?    // PostgreSQL JSON
  timestamp  DateTime @default(now())
  ipAddress  String?
  userAgent  String?
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@map("event_logs")
}
```

### Provider-specific Differences
- SQLite (development): `tags` stored as JSON strings; `metadata` stored as `String?`.
- PostgreSQL (production): `tags` as `String[]`; `metadata` as `Json?`.
- API endpoints normalize tags and metadata across providers for consistent responses.

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
