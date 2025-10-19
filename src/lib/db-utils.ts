import { prisma } from './prisma'
import { 
  CreateUserInput, 
  UpdateUserInput, 
  CreateNoteInput, 
  CreateEventLogInput,
  SearchOptions,
  PaginationOptions
} from './types/database'
import { getDatabaseConfig } from './db-config'
import { Prisma } from '@prisma/client'

const isPostgres = () => getDatabaseConfig().provider === 'postgresql'

/**
 * User operations
 */
export const userOperations = {
  async create(data: CreateUserInput) {
    return prisma.user.create({ data })
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } })
  }
}

/**
 * Note operations
 */
export const noteOperations = {
  async create(data: CreateNoteInput) {
    const noteData: Record<string, unknown> = {
      ...data,
    }
    noteData['tags'] = isPostgres() ? data.tags : JSON.stringify(data.tags)
    return prisma.note.create({ data: noteData as unknown as Prisma.NoteCreateInput })
  },

  async findById(id: string) {
    const note = await prisma.note.findUnique({ where: { id } })
    if (note) {
      const rawTags = (note as unknown as { tags: unknown }).tags
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string)
      return {
        ...note,
        tags: normalizedTags
      }
    }
    return null
  },

  async findByVideoId(videoId: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 10, orderBy = 'createdAt', orderDirection = 'desc' } = options
    
    const notes = await prisma.note.findMany({
      where: { videoId },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: true }
    })

    return notes.map(note => {
      const rawTags = (note as unknown as { tags: unknown }).tags
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string)
      return {
        ...note,
        tags: normalizedTags
      }
    })
  },

  async search(options: SearchOptions) {
    const { query, tags, videoId, userId, page = 1, limit = 10 } = options
    
    const where: Record<string, unknown> = {}
    
    if (videoId) where.videoId = videoId
    if (userId) where.userId = userId
    if (query) {
      where.content = { contains: query }
    }

    // If Postgres and tags provided, push array has filters to where clause to reduce data scanned
    if (isPostgres() && tags && tags.length > 0) {
      where.OR = tags.map(t => ({ tags: { has: t } }))
    }
    
    const notes = await prisma.note.findMany({
      where: where as unknown as Prisma.NoteWhereInput,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })

    // Normalize tags for both providers
    let normalizedNotes = notes.map(note => {
      const rawTags = (note as unknown as { tags: unknown }).tags
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string)
      return {
        ...note,
        tags: normalizedTags
      }
    })

    // For SQLite, filter by tags after normalization
    if (!isPostgres() && tags && tags.length > 0) {
      normalizedNotes = normalizedNotes.filter(note =>
        tags.some(tag => (note as unknown as { tags: string[] }).tags.includes(tag))
      )
    }

    return normalizedNotes
  },

  async update(id: string, data: Partial<Omit<CreateNoteInput, 'userId'>>) {
    const updateData: Record<string, unknown> = { ...data }
    if (data.tags) {
      updateData['tags'] = isPostgres() ? data.tags : JSON.stringify(data.tags)
    }
    
    const note = await prisma.note.update({ 
      where: { id }, 
      data: updateData as unknown as Prisma.NoteUpdateInput
    })
    
    const rawTags = (note as unknown as { tags: unknown }).tags
    const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string)
    return {
      ...note,
      tags: normalizedTags
    }
  },

  async delete(id: string) {
    return prisma.note.delete({ where: { id } })
  }
}

/**
 * Event log operations
 */
export const eventLogOperations = {
  async create(data: CreateEventLogInput) {
    const logData: Record<string, unknown> = {
      ...data,
    }
    logData['metadata'] = isPostgres() ? (data.metadata ?? null) : (data.metadata ? JSON.stringify(data.metadata) : null)
    return prisma.eventLog.create({ data: logData as unknown as Prisma.EventLogCreateInput })
  },

  async findByUserId(userId: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 50, orderBy = 'timestamp', orderDirection = 'desc' } = options
    
    const logs = await prisma.eventLog.findMany({
      where: { userId },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit
    })

    return logs.map(log => {
      const rawMeta = (log as unknown as { metadata: unknown }).metadata
      const normalizedMeta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta
      return {
        ...log,
        metadata: normalizedMeta as Record<string, unknown> | null
      }
    })
  },

  async findByEventType(eventType: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 50 } = options
    
    const logs = await prisma.eventLog.findMany({
      where: { eventType },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' }
    })

    return logs.map(log => {
      const rawMeta = (log as unknown as { metadata: unknown }).metadata
      const normalizedMeta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta
      return {
        ...log,
        metadata: normalizedMeta as Record<string, unknown> | null
      }
    })
  }
}

/**
 * Utility functions
 */
export const dbUtils = {
  async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { healthy: true }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  async getStats() {
    const [userCount, noteCount, eventCount] = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
      prisma.eventLog.count()
    ])

    return {
      users: userCount,
      notes: noteCount,
      events: eventCount
    }
  }
}