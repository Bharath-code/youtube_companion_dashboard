import { prisma } from '@/lib/prisma';
import { 
  CreateNoteInput, 
  UpdateNoteInput, 
  SearchOptions, 
  Note
} from '@/lib/types';
import { getDatabaseConfig } from '@/lib/db-config';
import { Prisma } from '@prisma/client';

const isPostgres = () => getDatabaseConfig().provider === 'postgresql';

export class NotesService {
  private static instance: NotesService;

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  /**
   * Create a new note
   */
  async createNote(input: CreateNoteInput): Promise<Note> {
    try {
      // Sanitize input
      const sanitizedContent = input.content.trim();
      const sanitizedTags = (input.tags || []).map(tag => tag.trim()).filter(Boolean);
      
      if (!sanitizedContent) {
        throw new Error('Note content cannot be empty');
      }

      const data: Record<string, unknown> = {
        videoId: input.videoId,
        content: sanitizedContent,
        userId: input.userId,
      };

      data['tags'] = isPostgres() ? sanitizedTags : JSON.stringify(sanitizedTags);

      const note = await prisma.note.create({
        data: data as unknown as Prisma.NoteCreateInput,
      });

      const rawTags = (note as unknown as { tags: unknown }).tags;
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string);

      return {
        ...note,
        tags: normalizedTags,
      };
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  /**
   * Get a note by ID (with user ownership check)
   */
  async getNoteById(noteId: string, userId: string): Promise<Note | null> {
    try {
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          userId: userId,
        },
      });

      if (!note) {
        return null;
      }

      const rawTags = (note as unknown as { tags: unknown }).tags;
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string);

      return {
        ...note,
        tags: normalizedTags,
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      throw new Error('Failed to fetch note');
    }
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, userId: string, input: UpdateNoteInput): Promise<Note | null> {
    try {
      // First check if note exists and belongs to user
      const existingNote = await prisma.note.findFirst({
        where: {
          id: noteId,
          userId: userId,
        },
      });

      if (!existingNote) {
        return null;
      }

      // Prepare update data with sanitization
      const updateData: Record<string, unknown> = {};
      
      if (input.content !== undefined) {
        const sanitizedContent = input.content.trim();
        if (!sanitizedContent) {
          throw new Error('Note content cannot be empty');
        }
        updateData.content = sanitizedContent;
      }
      
      if (input.videoId !== undefined) {
        updateData.videoId = input.videoId;
      }
      
      if (input.tags !== undefined) {
        const sanitizedTags = input.tags.map(tag => tag.trim()).filter(Boolean);
        updateData.tags = isPostgres() ? sanitizedTags : JSON.stringify(sanitizedTags);
      }

      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: updateData as unknown as Prisma.NoteUpdateInput,
      });

      const rawTags = (updatedNote as unknown as { tags: unknown }).tags;
      const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string);

      return {
        ...updatedNote,
        tags: normalizedTags,
      };
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    try {
      // First check if note exists and belongs to user
      const existingNote = await prisma.note.findFirst({
        where: {
          id: noteId,
          userId: userId,
        },
      });

      if (!existingNote) {
        return false;
      }

      await prisma.note.delete({
        where: { id: noteId },
      });

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  /**
   * Enhanced search and list notes with pagination and advanced filtering
   */
  async searchNotes(userId: string, options: SearchOptions = {}) {
    try {
      const {
        query,
        tags,
        videoId,
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options;

      // Build enhanced where clause
      const where: Record<string, unknown> = {
        userId,
      };

      if (videoId) {
        where.videoId = videoId;
      }

      // Enhanced text search with multiple strategies
      if (query && query.trim()) {
        const searchTerm = query.trim();
        
        // Search in content and tags depending on provider
        if (isPostgres()) {
          // Postgres arrays do not support text contains on arrays; search content only
          where.content = { contains: searchTerm };
        } else {
          // SQLite JSON string storage: search in both content and tags
          where.OR = [
            {
              content: {
                contains: searchTerm,
              },
            },
            {
              tags: {
                contains: searchTerm,
              },
            },
          ];
        }
      }

      // Enhanced tag filtering with exact matches
      if (tags && tags.length > 0) {
        if (isPostgres()) {
          const tagConditions = tags.map(tag => ({ tags: { has: tag } }));
          if (where.OR) {
            where.AND = [
              { OR: where.OR },
              { OR: tagConditions },
            ];
            delete where.OR;
          } else {
            where.OR = tagConditions;
          }
        } else {
          const tagConditions = tags.map(tag => ({
            tags: {
              contains: `"${tag}"`, // Exact tag match in JSON
            },
          }));

          if (where.OR) {
            // Combine with existing OR conditions
            where.AND = [
              { OR: where.OR },
              { OR: tagConditions },
            ];
            delete where.OR;
          } else {
            where.OR = tagConditions;
          }
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Determine ordering with relevance support
      let orderByClause: Record<string, string> = {};
      if (orderBy === 'relevance' && query) {
        // For relevance, order by updated date as a proxy
        orderByClause = { updatedAt: 'desc' };
      } else {
        orderByClause = { [orderBy]: orderDirection };
      }

      // Fetch notes and count
      const [notes, totalCount] = await Promise.all([
        prisma.note.findMany({
          where: where as unknown as Prisma.NoteWhereInput,
          orderBy: orderByClause as Prisma.NoteOrderByWithRelationInput,
          skip,
          take: limit,
        }),
        prisma.note.count({ where: where as unknown as Prisma.NoteWhereInput }),
      ]);

      // Normalize tags
      const notesWithParsedTags = notes.map((note) => {
        const rawTags = (note as unknown as { tags: unknown }).tags;
        const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string);
        return {
          ...note,
          tags: normalizedTags,
        };
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        notes: notesWithParsedTags,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching notes:', error);
      throw new Error('Failed to search notes');
    }
  }

  /**
   * Get search suggestions based on user's notes
   */
  async getSearchSuggestions(userId: string, query: string, limit = 10): Promise<Array<{
    text: string;
    type: 'content' | 'tag';
    frequency: number;
    context?: string;
  }>> {
    try {
      const suggestions: Array<{
        text: string;
        type: 'content' | 'tag';
        frequency: number;
        context?: string;
      }> = [];
      
      const queryLower = query.toLowerCase();

      // Get user's notes for generating suggestions
      const notes = await prisma.note.findMany({
        where: { userId },
        select: { content: true, tags: true },
      });

      // Generate content-based suggestions
      const contentWords = new Map<string, { count: number; contexts: string[] }>();
      
      notes.forEach(note => {
        // Extract words from content (simple tokenization)
        const words = note.content
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => 
            word.length > 2 && 
            word.includes(queryLower) &&
            word !== queryLower
          );

        words.forEach(word => {
          if (!contentWords.has(word)) {
            contentWords.set(word, { count: 0, contexts: [] });
          }
          const entry = contentWords.get(word)!;
          entry.count++;
          
          // Add context (surrounding text)
          const wordIndex = note.content.toLowerCase().indexOf(word);
          if (wordIndex !== -1 && entry.contexts.length < 3) {
            const start = Math.max(0, wordIndex - 30);
            const end = Math.min(note.content.length, wordIndex + word.length + 30);
            const context = note.content.substring(start, end).trim();
            entry.contexts.push(context);
          }
        });
      });

      // Convert content words to suggestions
      contentWords.forEach((data, word) => {
        suggestions.push({
          text: word,
          type: 'content',
          frequency: data.count,
          context: data.contexts[0],
        });
      });

      // Generate tag-based suggestions
      const tagFrequency = new Map<string, number>();
      
      notes.forEach(note => {
        const rawTags = (note as unknown as { tags: unknown }).tags;
        const parsedTags = Array.isArray(rawTags) ? (rawTags as string[]) : (() => {
          try { return JSON.parse(rawTags as string) as string[] } catch { return [] as string[] }
        })();
        parsedTags.forEach(tag => {
          const tagLower = tag.toLowerCase();
          if (tagLower.includes(queryLower) && tagLower !== queryLower) {
            tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
          }
        });
      });

      // Convert tags to suggestions
      tagFrequency.forEach((frequency, tag) => {
        suggestions.push({
          text: tag,
          type: 'tag',
          frequency,
        });
      });

      // Sort by frequency and limit results
      return suggestions
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      throw new Error('Failed to get search suggestions');
    }
  }

  /**
   * Get notes for a specific video
   */
  async getNotesForVideo(videoId: string, userId: string): Promise<Note[]> {
    try {
      const notes = await prisma.note.findMany({
        where: {
          videoId: videoId,
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notes.map((note) => {
        const rawTags = (note as unknown as { tags: unknown }).tags;
        const normalizedTags = Array.isArray(rawTags) ? (rawTags as string[]) : JSON.parse(rawTags as string);
        return {
          ...note,
          tags: normalizedTags,
        };
      });
    } catch (error) {
      console.error('Error fetching notes for video:', error);
      throw new Error('Failed to fetch notes for video');
    }
  }

  /**
   * Get all unique tags for a user
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      const notes = await prisma.note.findMany({
        where: { userId },
        select: { tags: true },
      });

      const allTags = new Set<string>();
      
      notes.forEach((note) => {
        const rawTags = (note as unknown as { tags: unknown }).tags;
        const parsedTags = Array.isArray(rawTags) ? (rawTags as string[]) : (() => {
          try { return JSON.parse(rawTags as string) as string[] } catch { return [] as string[] }
        })();
        parsedTags.forEach(tag => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error fetching user tags:', error);
      throw new Error('Failed to fetch user tags');
    }
  }

  /**
   * Get notes statistics for a user
   */
  async getNotesStats(userId: string) {
    try {
      const [totalNotes, notesThisMonth, uniqueVideos] = await Promise.all([
        prisma.note.count({
          where: { userId },
        }),
        prisma.note.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.note.groupBy({
          by: ['videoId'],
          where: { userId },
          _count: true,
        }),
      ]);

      return {
        totalNotes,
        notesThisMonth,
        uniqueVideos: uniqueVideos.length,
      };
    } catch (error) {
      console.error('Error fetching notes stats:', error);
      throw new Error('Failed to fetch notes statistics');
    }
  }
}

// Export singleton instance
export const notesService = NotesService.getInstance();