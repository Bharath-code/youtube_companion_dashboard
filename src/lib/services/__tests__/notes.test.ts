import { NotesService } from '../notes';
import { prisma } from '@/lib/prisma';
import { CreateNoteInput, UpdateNoteInput } from '@/lib/types';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    note: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('NotesService', () => {
  let notesService: NotesService;
  const mockUserId = 'user-123';
  const mockVideoId = 'video-123';
  const mockNoteId = 'note-123';

  beforeEach(() => {
    notesService = NotesService.getInstance();
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('should create a note successfully', async () => {
      const input: CreateNoteInput = {
        videoId: mockVideoId,
        content: 'Test note content',
        tags: ['tag1', 'tag2'],
        userId: mockUserId,
      };

      const mockCreatedNote = {
        id: mockNoteId,
        videoId: mockVideoId,
        content: 'Test note content',
        tags: JSON.stringify(['tag1', 'tag2']),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.create.mockResolvedValue(mockCreatedNote);

      const result = await notesService.createNote(input);

      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: {
          videoId: input.videoId,
          content: input.content,
          tags: JSON.stringify(input.tags),
          userId: input.userId,
        },
      });

      expect(result).toEqual({
        ...mockCreatedNote,
        tags: ['tag1', 'tag2'],
      });
    });

    it('should handle creation errors', async () => {
      const input: CreateNoteInput = {
        videoId: mockVideoId,
        content: 'Test note content',
        tags: [],
        userId: mockUserId,
      };

      mockPrisma.note.create.mockRejectedValue(new Error('Database error'));

      await expect(notesService.createNote(input)).rejects.toThrow('Failed to create note');
    });
  });

  describe('getNoteById', () => {
    it('should return a note when found', async () => {
      const mockNote = {
        id: mockNoteId,
        videoId: mockVideoId,
        content: 'Test note content',
        tags: JSON.stringify(['tag1']),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(mockNote);

      const result = await notesService.getNoteById(mockNoteId, mockUserId);

      expect(mockPrisma.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockNoteId,
          userId: mockUserId,
        },
      });

      expect(result).toEqual({
        ...mockNote,
        tags: ['tag1'],
      });
    });

    it('should return null when note not found', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);

      const result = await notesService.getNoteById(mockNoteId, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateNote', () => {
    it('should update a note successfully', async () => {
      const updateInput: UpdateNoteInput = {
        content: 'Updated content',
        tags: ['updated-tag'],
      };

      const mockExistingNote = {
        id: mockNoteId,
        videoId: mockVideoId,
        content: 'Original content',
        tags: JSON.stringify(['original-tag']),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedNote = {
        ...mockExistingNote,
        content: 'Updated content',
        tags: JSON.stringify(['updated-tag']),
      };

      mockPrisma.note.findFirst.mockResolvedValue(mockExistingNote);
      mockPrisma.note.update.mockResolvedValue(mockUpdatedNote);

      const result = await notesService.updateNote(mockNoteId, mockUserId, updateInput);

      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          content: updateInput.content,
          tags: JSON.stringify(updateInput.tags),
        },
      });

      expect(result).toEqual({
        ...mockUpdatedNote,
        tags: ['updated-tag'],
      });
    });

    it('should return null when note not found', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);

      const result = await notesService.updateNote(mockNoteId, mockUserId, { content: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('deleteNote', () => {
    it('should delete a note successfully', async () => {
      const mockNote = {
        id: mockNoteId,
        videoId: mockVideoId,
        content: 'Test note',
        tags: '[]',
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(mockNote);
      mockPrisma.note.delete.mockResolvedValue(mockNote);

      const result = await notesService.deleteNote(mockNoteId, mockUserId);

      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: { id: mockNoteId },
      });

      expect(result).toBe(true);
    });

    it('should return false when note not found', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);

      const result = await notesService.deleteNote(mockNoteId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('searchNotes', () => {
    it('should search notes with pagination', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          videoId: mockVideoId,
          content: 'First note',
          tags: JSON.stringify(['tag1']),
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'note-2',
          videoId: mockVideoId,
          content: 'Second note',
          tags: JSON.stringify(['tag2']),
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.note.findMany.mockResolvedValue(mockNotes);
      mockPrisma.note.count.mockResolvedValue(2);

      const result = await notesService.searchNotes(mockUserId, {
        query: 'note',
        page: 1,
        limit: 10,
      });

      expect(result.notes).toHaveLength(2);
      expect(result.pagination.totalCount).toBe(2);
      expect(result.notes[0].tags).toEqual(['tag1']);
      expect(result.notes[1].tags).toEqual(['tag2']);
    });
  });
});