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
  userId: string
}

// Event types enum
export enum EventType {
  // Video events
  VIDEO_VIEWED = 'video_viewed',
  VIDEO_UPDATED = 'video_updated',
  VIDEO_LOADED = 'video_loaded',
  VIDEO_PLAYED = 'video_played',
  VIDEO_PAUSED = 'video_paused',
  VIDEO_SEEKED = 'video_seeked',
  
  // Comment events
  COMMENT_ADDED = 'comment_added',
  COMMENT_DELETED = 'comment_deleted',
  
  // Note events
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  
  // Search events
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_SUGGESTION_CLICKED = 'search_suggestion_clicked',
  
  // Authentication events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // UI interaction events
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TAB_SWITCH = 'tab_switch',
  FILTER_APPLIED = 'filter_applied',
  EXPORT_INITIATED = 'export_initiated',
  
  // Error events
  API_ERROR = 'api_error',
  CLIENT_ERROR = 'client_error',
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error'
}

// Entity types enum
export enum EntityType {
  USER = 'user',
  VIDEO = 'video',
  NOTE = 'note',
  COMMENT = 'comment',
  PAGE = 'page',
  BUTTON = 'button',
  FORM = 'form',
  MODAL = 'modal',
  TAB = 'tab',
  FILTER = 'filter',
  SEARCH = 'search',
  SYSTEM = 'system'
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