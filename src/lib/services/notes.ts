import { prisma } from '@/lib/prisma';
import { 
  CreateNoteInput, 
  UpdateNoteInput, 
  SearchOptions, 
  Note
} from '@/lib/types';

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

      const note = await prisma.note.create({
        data: {
          videoId: input.videoId,
          content: sanitizedContent,
          tags: JSON.stringify(sanitizedTags),
          userId: input.userId,
        },
      });

      return {
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : [],
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

      return {
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : [],
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
        updateData.tags = JSON.stringify(sanitizedTags);
      }

      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: updateData,
      });

      return {
        ...updatedNote,
        tags: updatedNote.tags ? JSON.parse(updatedNote.tags) : [],
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
        userId: userId,
      };

      if (videoId) {
        where.videoId = videoId;
      }

      // Enhanced text search with multiple strategies
      if (query && query.trim()) {
        const searchTerm = query.trim();
        
        // Search in both content and tags
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

      // Enhanced tag filtering with exact matches
      if (tags && tags.length > 0) {
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
          where,
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        prisma.note.count({ where }),
      ]);

      // Parse tags from JSON strings
      const notesWithParsedTags = notes.map((note) => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags as string) : [],
      }));

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
        if (note.tags) {
          try {
            const tags = JSON.parse(note.tags) as string[];
            tags.forEach(tag => {
              const tagLower = tag.toLowerCase();
              if (tagLower.includes(queryLower) && tagLower !== queryLower) {
                tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
              }
            });
          } catch (error) {
            console.error('Error parsing tags:', error);
          }
        }
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

      return notes.map((note) => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags as string) : [],
      }));
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
        if (note.tags) {
          try {
            const tags = JSON.parse(note.tags) as string[];
            tags.forEach(tag => allTags.add(tag));
          } catch (error) {
            console.error('Error parsing tags:', error);
          }
        }
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