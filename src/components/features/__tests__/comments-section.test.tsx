import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentsSection } from '../comments-section';

// Mock fetch
global.fetch = jest.fn();

// Mock next-auth
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCommentsResponse = {
  success: true,
  data: {
    comments: [
      {
        id: 'comment1',
        textDisplay: 'Great video!',
        authorDisplayName: 'John Doe',
        authorProfileImageUrl: 'https://example.com/avatar1.jpg',
        publishedAt: '2024-01-01T12:00:00Z',
        likeCount: 5,
        replies: [
          {
            id: 'reply1',
            textDisplay: 'Thanks!',
            authorDisplayName: 'Video Creator',
            authorProfileImageUrl: 'https://example.com/avatar2.jpg',
            publishedAt: '2024-01-01T13:00:00Z',
            likeCount: 2,
          }
        ]
      },
      {
        id: 'comment2',
        textDisplay: 'Very informative content.',
        authorDisplayName: 'Jane Smith',
        authorProfileImageUrl: 'https://example.com/avatar3.jpg',
        publishedAt: '2024-01-01T14:00:00Z',
        likeCount: 3,
      }
    ],
    nextPageToken: 'next_page_token'
  }
};

describe('CommentsSection', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  it('should render empty state when no videoId provided', () => {
    render(<CommentsSection videoId="" />);
    
    expect(screen.getByText('Select a video to view comments')).toBeInTheDocument();
  });

  it('should fetch and display comments when videoId is provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    // Should show loading state initially
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Check if comments are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Very informative content.')).toBeInTheDocument();

    // Check if like counts are displayed
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Check if replies button is shown
    expect(screen.getByText('Show 1 reply')).toBeInTheDocument();
  });

  it('should expand and collapse replies when clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Click to expand replies
    const showRepliesButton = screen.getByText('Show 1 reply');
    fireEvent.click(showRepliesButton);

    // Check if reply is now visible
    expect(screen.getByText('Thanks!')).toBeInTheDocument();
    expect(screen.getByText('Video Creator')).toBeInTheDocument();

    // Button text should change
    expect(screen.getByText('Hide 1 reply')).toBeInTheDocument();

    // Click to collapse replies
    const hideRepliesButton = screen.getByText('Hide 1 reply');
    fireEvent.click(hideRepliesButton);

    // Reply should be hidden again
    expect(screen.queryByText('Thanks!')).not.toBeInTheDocument();
    expect(screen.getByText('Show 1 reply')).toBeInTheDocument();
  });

  it('should load more comments when Load More button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommentsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            comments: [
              {
                id: 'comment3',
                textDisplay: 'Another comment',
                authorDisplayName: 'Bob Wilson',
                authorProfileImageUrl: 'https://example.com/avatar4.jpg',
                publishedAt: '2024-01-01T15:00:00Z',
                likeCount: 1,
              }
            ],
            nextPageToken: undefined
          }
        }),
      });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Click Load More button
    const loadMoreButton = screen.getByText('Load More Comments');
    fireEvent.click(loadMoreButton);

    // Wait for new comment to appear
    await waitFor(() => {
      expect(screen.getByText('Another comment')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Load More button should disappear when no more pages
    expect(screen.queryByText('Load More Comments')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Video not found'
      }),
    });

    render(<CommentsSection videoId="invalid-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Video not found')).toBeInTheDocument();
    });

    // Should show Try Again button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should show Try Again button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should show no comments message when video has no comments', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: [],
          nextPageToken: undefined
        }
      }),
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('No comments found for this video')).toBeInTheDocument();
    });
  });

  it('should make correct API call with parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/youtube/comments?id=test-video-id&maxResults=20');
    });
  });

  it('should handle comments disabled gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Comments are disabled for this video'
      }),
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Comments are disabled for this video')).toBeInTheDocument();
    });

    expect(screen.getByText('The video creator has turned off comments.')).toBeInTheDocument();
    // Should not show the generic error UI
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should show sign in prompt when not authenticated', () => {
    render(<CommentsSection videoId="test-video-id" />);
    
    expect(screen.getByText('Sign in to post comments and interact with the community.')).toBeInTheDocument();
  });

  it('should show comment form when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<CommentsSection videoId="test-video-id" />);
    
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should post new comment when form is submitted', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommentsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'new-comment',
            textDisplay: 'New test comment',
            authorDisplayName: 'Test User',
            authorProfileImageUrl: 'https://example.com/avatar.jpg',
            publishedAt: '2024-01-01T16:00:00Z',
            likeCount: 0,
          }
        }),
      });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Type in comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'New test comment' } });

    // Submit comment - use more specific selector
    const submitButton = screen.getByRole('button', { name: 'Comment' });
    fireEvent.click(submitButton);

    // Wait for comment to be posted
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/youtube/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: 'test-video-id',
          text: 'New test comment',
        }),
      });
    });
  });

  it('should show reply form when reply button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Click reply button (get the first one)
    const replyButtons = screen.getAllByRole('button', { name: 'Reply' });
    fireEvent.click(replyButtons[0]);

    // Check if reply form appears
    expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
  });

  it('should show delete button for own comments', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Should show delete button for John Doe's comment
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCommentsResponse,
    });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this comment? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Comment' })).toBeInTheDocument();
  });

  it('should delete comment when confirmed', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com' },
        accessToken: 'mock-token',
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommentsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { deleted: true }
        }),
      });

    render(<CommentsSection videoId="test-video-id" />);

    await waitFor(() => {
      expect(screen.getByText('Great video!')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete Comment' });
    fireEvent.click(confirmButton);

    // Wait for deletion API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/youtube/comments/comment1', {
        method: 'DELETE',
      });
    });
  });
});