import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    note: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockAuth = auth as any;
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  note: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as any;

describe('/api/notes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
    image: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notes', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/notes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/notes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return notes with pagination', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const mockNotes = [
        {
          id: 'note-1',
          videoId: 'video-123',
          content: 'Test note 1',
          tags: JSON.stringify(['tag1']),
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'note-2',
          videoId: 'video-123',
          content: 'Test note 2',
          tags: JSON.stringify(['tag2']),
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.note.findMany.mockResolvedValue(mockNotes);
      mockPrisma.note.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/notes?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notes).toHaveLength(2);
      expect(data.data.notes[0].tags).toEqual(['tag1']);
      expect(data.data.pagination.totalCount).toBe(2);
    });

    it('should handle search parameters', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.note.findMany.mockResolvedValue([]);
      mockPrisma.note.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/notes?query=test&videoId=video-123&tags=tag1,tag2');
      const response = await GET(request);

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          videoId: 'video-123',
          content: {
            contains: 'test',
            mode: 'insensitive',
          },
          tags: {
            contains: 'tag1|tag2',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('POST /api/notes', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          videoId: 'video-123',
          content: 'Test note',
          tags: ['tag1'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should create a note successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const mockCreatedNote = {
        id: 'note-123',
        videoId: 'video-123',
        content: 'Test note',
        tags: JSON.stringify(['tag1']),
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.create.mockResolvedValue(mockCreatedNote);

      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          videoId: 'video-123',
          content: 'Test note',
          tags: ['tag1'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('Test note');
      expect(data.data.tags).toEqual(['tag1']);
      expect(data.message).toBe('Note created successfully');

      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: {
          videoId: 'video-123',
          content: 'Test note',
          tags: JSON.stringify(['tag1']),
          userId: 'user-123',
        },
      });
    });

    it('should return 400 for invalid input', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          videoId: '', // Invalid: empty string
          content: 'Test note',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid input data');
    });
  });
});