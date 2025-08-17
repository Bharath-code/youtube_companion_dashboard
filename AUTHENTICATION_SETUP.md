# Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for the YouTube Companion Dashboard.

## Prerequisites

1. A Google Cloud Console project
2. YouTube Data API v3 enabled
3. OAuth 2.0 credentials configured

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: "YouTube Companion Dashboard"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes (click "Add or Remove Scopes"):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `../auth/youtube.readonly`
   - `../auth/youtube.force-ssl`
5. **Important for Development**: Add test users
   - In the "Test users" section, click "Add users"
   - Add your email address and any other emails you want to test with
   - Save changes

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Set application type to "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
5. Save and copy the Client ID and Client Secret

## Step 4: Environment Variables

Update your `.env` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console

# YouTube API Configuration
YOUTUBE_API_KEY=your-youtube-api-key
```

## Step 5: Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Replace `your-nextauth-secret-here-change-this-in-production` with the generated secret.

## Step 6: Test Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Sign In to Get Started"
4. You should be redirected to Google OAuth
5. After successful authentication, you'll be redirected back to the dashboard

## OAuth Scopes

The application requests the following Google OAuth scopes:

- `openid`: Basic OpenID Connect
- `email`: User's email address
- `profile`: User's basic profile information
- `https://www.googleapis.com/auth/youtube.readonly`: Read access to YouTube data
- `https://www.googleapis.com/auth/youtube.force-ssl`: Manage YouTube videos and comments

## Security Notes

1. **Never commit real credentials to version control**
2. **Use different credentials for development and production**
3. **Regularly rotate your API keys and secrets**
4. **Restrict API key usage to specific domains/IPs in production**
5. **Monitor API usage in Google Cloud Console**

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Check that your Client ID and Secret are correct
2. **"Redirect URI mismatch"**: Ensure the redirect URI in Google Console matches your application URL
3. **"Access denied" / "App not verified"**: 
   - Add your email as a test user in OAuth consent screen
   - Or publish the app (may require verification for YouTube scopes)
4. **"Invalid scope"**: Check that YouTube API is enabled in your Google Cloud project
5. **"App is being tested"**: Your app is in testing mode - add test users or publish the app

### Debug Mode

To enable debug logging, add to your `.env`:

```env
NEXTAUTH_DEBUG=true
```

This will provide detailed logs about the authentication process.