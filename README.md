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
