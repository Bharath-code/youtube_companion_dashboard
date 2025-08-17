import { YouTubeService, YouTubeAuthError, YouTubeNotFoundError } from '../youtube';

// Mock fetch for testing
global.fetch = jest.fn();

describe('YouTubeService', () => {
  let service: YouTubeService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new YouTubeService(mockApiKey);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if no API key provided', () => {
      // Mock process.env to not have YOUTUBE_API_KEY
      const originalEnv = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;
      
      expect(() => new YouTubeService('')).toThrow(YouTubeAuthError);
      expect(() => new YouTubeService()).toThrow(YouTubeAuthError);
      
      // Restore original env
      if (originalEnv) {
        process.env.YOUTUBE_API_KEY = originalEnv;
      }
    });

    it('should use provided API key', () => {
      const testService = new YouTubeService('test-key');
      expect(testService.getAPIInfo().hasApiKey).toBe(true);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from standard YouTube URL', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'dQw4w9WgXcQ',
            snippet: {
              title: 'Test Video',
              description: 'Test Description',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              thumbnails: {
                default: { url: 'test.jpg', width: 120, height: 90 }
              }
            },
            statistics: {
              viewCount: '1000',
              likeCount: '100',
              commentCount: '10'
            },
            status: {
              privacyStatus: 'public'
            }
          }]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getVideoDetails('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.id).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from youtu.be URL', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'dQw4w9WgXcQ',
            snippet: {
              title: 'Test Video',
              description: 'Test Description',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              thumbnails: {
                default: { url: 'test.jpg', width: 120, height: 90 }
              }
            },
            statistics: {
              viewCount: '1000',
              likeCount: '100',
              commentCount: '10'
            },
            status: {
              privacyStatus: 'public'
            }
          }]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getVideoDetails('https://youtu.be/dQw4w9WgXcQ');
      expect(result.id).toBe('dQw4w9WgXcQ');
    });

    it('should accept direct video ID', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'dQw4w9WgXcQ',
            snippet: {
              title: 'Test Video',
              description: 'Test Description',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              thumbnails: {
                default: { url: 'test.jpg', width: 120, height: 90 }
              }
            },
            statistics: {
              viewCount: '1000',
              likeCount: '100',
              commentCount: '10'
            },
            status: {
              privacyStatus: 'public'
            }
          }]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getVideoDetails('dQw4w9WgXcQ');
      expect(result.id).toBe('dQw4w9WgXcQ');
    });
  });

  describe('getVideoDetails', () => {
    it('should return video details for valid video', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'dQw4w9WgXcQ',
            snippet: {
              title: 'Test Video',
              description: 'Test Description',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              thumbnails: {
                default: { url: 'test.jpg', width: 120, height: 90 }
              }
            },
            statistics: {
              viewCount: '1000',
              likeCount: '100',
              commentCount: '10'
            },
            status: {
              privacyStatus: 'public'
            }
          }]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getVideoDetails('dQw4w9WgXcQ');

      expect(result).toEqual({
        id: 'dQw4w9WgXcQ',
        title: 'Test Video',
        description: 'Test Description',
        publishedAt: '2023-01-01T00:00:00Z',
        channelId: 'test-channel',
        channelTitle: 'Test Channel',
        thumbnails: [{ url: 'test.jpg', width: 120, height: 90 }],
        statistics: {
          viewCount: 1000,
          likeCount: 100,
          commentCount: 10
        }
      });
    });

    it('should throw error for non-existent video', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ items: [] })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getVideoDetails('invalid-id')).rejects.toThrow(YouTubeNotFoundError);
    });

    it('should throw error for private video', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'dQw4w9WgXcQ',
            snippet: {
              title: 'Private Video',
              description: 'Private Description',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              thumbnails: {}
            },
            statistics: {
              viewCount: '0',
              likeCount: '0',
              commentCount: '0'
            },
            status: {
              privacyStatus: 'private'
            }
          }]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getVideoDetails('dQw4w9WgXcQ')).rejects.toThrow(YouTubeNotFoundError);
    });
  });

  describe('error handling', () => {
    it('should handle 401 authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid API key' }
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getVideoDetails('dQw4w9WgXcQ')).rejects.toThrow(YouTubeAuthError);
    });

    it('should handle 429 rate limit errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Rate limit exceeded' }
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getVideoDetails('dQw4w9WgXcQ')).rejects.toThrow('Rate limit exceeded');
    }, 10000);

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(service.getVideoDetails('dQw4w9WgXcQ')).rejects.toThrow('Network error');
    });
  });

  describe('validateAPIKey', () => {
    it('should return true for valid API key', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ items: [] })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.validateAPIKey();
      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid API key' }
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.validateAPIKey();
      expect(result).toBe(false);
    });
  });
});