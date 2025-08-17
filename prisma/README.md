# Database Setup

This project uses Prisma ORM with SQLite for development and PostgreSQL for production.

## Database Schema

The database consists of three main models:

### User
- Stores user authentication information from Google OAuth
- Contains access and refresh tokens for YouTube API
- Related to Notes and EventLogs

### Note
- User-created notes associated with YouTube videos
- Supports tagging system (stored as JSON string for SQLite compatibility)
- Soft-linked to videos by videoId

### EventLog
- Comprehensive logging of all user interactions
- Tracks API calls, user actions, and system events
- Includes metadata for debugging and analytics

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Run initial migration:**
   ```bash
   npm run db:migrate
   ```

4. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

## Production Setup

1. **Set environment variables:**
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/youtube_companion_db"
   NODE_ENV="production"
   ```

2. **Use production schema:**
   The production schema (`schema.production.prisma`) uses PostgreSQL-specific features:
   - Native array support for tags
   - JSON type for metadata
   - Better indexing and performance

3. **Deploy migrations:**
   ```bash
   npx prisma migrate deploy
   ```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Create and apply new migration
- `npm run db:reset` - Reset database and apply all migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio for database inspection
- `npm run db:push` - Push schema changes without creating migration

## Schema Files

- `schema.prisma` - Development schema (SQLite)
- `schema.production.prisma` - Production schema (PostgreSQL)

The appropriate schema is used based on the `NODE_ENV` environment variable.

## Migration Strategy

- Development uses SQLite with JSON strings for complex data types
- Production uses PostgreSQL with native JSON and array support
- Migrations are created in development and deployed to production
- Always test migrations in a staging environment before production deployment