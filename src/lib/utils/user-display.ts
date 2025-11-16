import { User } from '@prisma/client';
import { Session } from 'next-auth';

/**
 * Get the user's preferred display name with fallback logic
 */
export function getUserDisplayName(user: Partial<User> | null, session?: Session | null): string {
  if (!user && !session) {
    return 'Anonymous User';
  }

  // Priority order:
  // 1. Custom displayName from database
  // 2. Custom username from database  
  // 3. Name from database (OAuth name)
  // 4. Name from session (OAuth name)
  // 5. Email (first part before @)
  // 6. Fallback to 'User'

  if (user?.displayName) {
    return user.displayName;
  }

  if (user?.username) {
    return user.username;
  }

  if (user?.name) {
    return user.name;
  }

  if (session?.user?.name) {
    return session.user.name;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  if (session?.user?.email) {
    return session.user.email.split('@')[0];
  }

  return 'User';
}

/**
 * Get a short display name (for avatars, etc.)
 */
export function getUserShortName(user: Partial<User> | null, session?: Session | null): string {
  const fullName = getUserDisplayName(user, session);
  
  // If it's a single word, return first 2 characters
  if (!fullName.includes(' ')) {
    return fullName.substring(0, 2).toUpperCase();
  }

  // If it's multiple words, return first letter of each word (max 2)
  const words = fullName.split(' ');
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Check if user has a custom display name set
 */
export function hasCustomDisplayName(user: Partial<User> | null): boolean {
  return !!(user?.displayName || user?.username);
}

/**
 * Get user avatar with fallback logic
 */
export function getUserAvatar(user: Partial<User> | null, session?: Session | null): string | null {
  if (user?.image) {
    return user.image;
  }

  if (session?.user?.image) {
    return session.user.image;
  }

  return null;
}