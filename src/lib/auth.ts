import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        
        // Fetch YouTube channel information on first sign in
        try {
          const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              token.youtubeChannelId = data.items[0].id;
              token.youtubeChannelTitle = data.items[0].snippet.title;
            }
          }
        } catch (error) {
          console.error('Failed to fetch YouTube channel info:', error);
          // Continue without channel info - not critical for auth
        }
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.youtubeChannelId = token.youtubeChannelId as string
        session.youtubeChannelTitle = token.youtubeChannelTitle as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
})