import { User, Note as PrismaNote, EventLog } from '@prisma/client'

// Re-export Prisma types
export type { User, EventLog }

// Extended Note type with parsed tags
export interface Note extends Omit<PrismaNote, 'tags'> {
  tags: string[]
}

// Raw Prisma Note type (for internal use)
export type { PrismaNote }

// Extended types with relationships
export type UserWithRelations = User & {
  notes: Note[]
  eventLogs: EventLog[]
}

export type NoteWithUser = Note & {
  user: User
}

export type EventLogWithUser = EventLog & {
  user: User
}

// Input types for creating/updating records
export type CreateUserInput = {
  email: string
  name?: string
  image?: string
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email'>>

export type CreateNoteInput = {
  videoId: string
  content: string
  tags: string[]
  userId: string
}

export type UpdateNoteInput = Partial<Omit<CreateNoteInput, 'userId'>>

export type CreateEventLogInput = {
  eventType: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  userId?: string
}

// Event types enum
export enum EventType {
  VIDEO_VIEWED = 'video_viewed',
  VIDEO_UPDATED = 'video_updated',
  COMMENT_ADDED = 'comment_added',
  COMMENT_DELETED = 'comment_deleted',
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  SEARCH_PERFORMED = 'search_performed',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  API_ERROR = 'api_error',
  AUTH_ERROR = 'auth_error',
}

// Entity types enum
export enum EntityType {
  USER = 'user',
  VIDEO = 'video',
  NOTE = 'note',
  COMMENT = 'comment'
}

// Database utility types
export type DatabaseError = {
  code: string
  message: string
  meta?: Record<string, unknown>
}

export type PaginationOptions = {
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'content' | 'relevance'
  orderDirection?: 'asc' | 'desc'
}

export type SearchOptions = {
  query?: string
  tags?: string[]
  videoId?: string
  userId?: string
  includeHighlights?: boolean
} & PaginationOptions