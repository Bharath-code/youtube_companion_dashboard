// Application configuration

export const config = {
  app: {
    name: 'YouTube Companion Dashboard',
    description: 'Comprehensive management for your YouTube videos',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    baseUrl: 'https://www.googleapis.com/youtube/v3',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
} as const;

// Validate required environment variables
export function validateConfig() {
  const required = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'YOUTUBE_API_KEY',
    'DATABASE_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
