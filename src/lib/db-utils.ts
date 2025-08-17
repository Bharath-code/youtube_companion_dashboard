import { prisma } from './prisma'
import { 
  CreateUserInput, 
  UpdateUserInput, 
  CreateNoteInput, 
  CreateEventLogInput,
  SearchOptions,
  PaginationOptions
} from './types/database'

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
    const noteData = {
      ...data,
      tags: JSON.stringify(data.tags) // Convert array to JSON string for SQLite
    }
    return prisma.note.create({ data: noteData })
  },

  async findById(id: string) {
    const note = await prisma.note.findUnique({ where: { id } })
    if (note) {
      return {
        ...note,
        tags: JSON.parse(note.tags) // Convert JSON string back to array
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

    return notes.map(note => ({
      ...note,
      tags: JSON.parse(note.tags)
    }))
  },

  async search(options: SearchOptions) {
    const { query, tags, videoId, userId, page = 1, limit = 10 } = options
    
    const where: Record<string, unknown> = {}
    
    if (videoId) where.videoId = videoId
    if (userId) where.userId = userId
    if (query) {
      where.content = { contains: query, mode: 'insensitive' }
    }
    
    const notes = await prisma.note.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })

    // Filter by tags if provided (since we store tags as JSON string)
    let filteredNotes = notes.map(note => ({
      ...note,
      tags: JSON.parse(note.tags)
    }))

    if (tags && tags.length > 0) {
      filteredNotes = filteredNotes.filter(note =>
        tags.some(tag => note.tags.includes(tag))
      )
    }

    return filteredNotes
  },

  async update(id: string, data: Partial<Omit<CreateNoteInput, 'userId'>>) {
    const updateData = data.tags 
      ? { ...data, tags: JSON.stringify(data.tags) }
      : data
    
    const note = await prisma.note.update({ 
      where: { id }, 
      data: updateData as Record<string, unknown>
    })
    
    return {
      ...note,
      tags: JSON.parse(note.tags)
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
    const logData = {
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
    return prisma.eventLog.create({ data: logData })
  },

  async findByUserId(userId: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 50, orderBy = 'timestamp', orderDirection = 'desc' } = options
    
    const logs = await prisma.eventLog.findMany({
      where: { userId },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit
    })

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }))
  },

  async findByEventType(eventType: string, options: PaginationOptions = {}) {
    const { page = 1, limit = 50 } = options
    
    const logs = await prisma.eventLog.findMany({
      where: { eventType },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' }
    })

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }))
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