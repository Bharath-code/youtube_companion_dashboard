# Deployment Guide

This guide covers deploying the YouTube Companion Dashboard to Vercel with a PostgreSQL database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Code should be in a GitHub repository
3. **Google Cloud Console**: For OAuth and YouTube API credentials
4. **Database Provider**: Choose one:
   - Vercel Postgres (recommended)
   - Supabase
   - PlanetScale
   - Neon
   - Railway

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Choose your region and create the database
4. Copy the connection string from the `.env.local` tab

### Option B: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual password

### Option C: PlanetScale

1. Create a new database at [planetscale.com](https://planetscale.com)
2. Create a connection string
3. Use the MySQL format connection string

## Step 2: Google Cloud Console Setup

### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create an API key:
   - Go to Credentials → Create Credentials → API Key
   - Restrict the key to YouTube Data API v3
   - Add your domain restrictions for production

### Google OAuth

1. In the same Google Cloud project
2. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
3. Configure OAuth consent screen if not done
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app-name.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret

## Step 3: Environment Variables

Set up the following environment variables in Vercel:

### Required Variables

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secure-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Database
DATABASE_URL=your-database-connection-string

# Environment
NODE_ENV=production
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Step 4: Deploy to Vercel

### Method 1: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Add all environment variables
5. Deploy

### Method 2: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel --prod
   ```

## Step 5: Database Migration

The deployment will automatically run database migrations via the `vercel-build` script. If you need to run migrations manually:

1. Install Vercel CLI
2. Link your project: `vercel link`
3. Run migrations: `vercel env pull .env.local && npx prisma migrate deploy`

## Step 6: Post-Deployment Configuration

### Update Google OAuth

1. Go back to Google Cloud Console
2. Update OAuth redirect URIs with your production URL
3. Update authorized domains

### Test the Application

1. Visit your deployed application
2. Test Google OAuth login
3. Test YouTube API integration
4. Verify event logging is working
5. Check database connections

## Step 7: Monitoring and Analytics

### Vercel Analytics (Optional)

1. Enable Vercel Analytics in your dashboard
2. Add `VERCEL_ANALYTICS_ID` environment variable

### Error Monitoring (Optional)

Consider adding error monitoring with:
- Sentry
- LogRocket
- Bugsnag

## Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**
   - Ensure redirect URIs match exactly in Google Cloud Console
   - Check NEXTAUTH_URL is set correctly

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database provider firewall settings
   - Ensure SSL is enabled for production databases

3. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed
   - Check environment variables are set

4. **API Rate Limits**
   - YouTube API has quotas - monitor usage
   - Consider implementing caching for frequently accessed data

### Logs and Debugging

1. **Vercel Function Logs**
   - View in Vercel dashboard under Functions tab
   - Use `console.log` for debugging (remove in production)

2. **Database Logs**
   - Check your database provider's logs
   - Monitor connection counts and query performance

## Environment-Specific Configurations

### Development
```bash
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

### Production
```bash
NEXTAUTH_URL=https://your-app-name.vercel.app
DATABASE_URL="postgresql://..."
NODE_ENV=production
```

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly

2. **Database Security**
   - Use SSL connections in production
   - Implement proper access controls
   - Regular security updates

3. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only in production

## Performance Optimization

1. **Database**
   - Use connection pooling
   - Implement proper indexing
   - Monitor query performance

2. **Caching**
   - Implement Redis for session storage
   - Cache YouTube API responses
   - Use Vercel Edge caching

3. **Monitoring**
   - Set up performance monitoring
   - Monitor API response times
   - Track user engagement metrics

## Backup and Recovery

1. **Database Backups**
   - Enable automated backups on your database provider
   - Test backup restoration procedures
   - Document recovery processes

2. **Code Backups**
   - Ensure code is backed up in GitHub
   - Tag releases for easy rollback
   - Document deployment procedures

## Support

For deployment issues:
1. Check Vercel documentation
2. Review database provider documentation
3. Check Google Cloud Console for API issues
4. Review application logs for specific errors