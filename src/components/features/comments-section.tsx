'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Comment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MessageCircle, ThumbsUp, User, ChevronDown, ChevronUp, Send, Reply, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { getUserDisplayName, getUserAvatar } from '@/lib/utils/user-display';

interface CommentsSectionProps {
  videoId: string;
  className?: string;
}

interface CommentsResponse {
  comments: Comment[];
  nextPageToken?: string;
}

export function CommentsSection({ videoId, className }: CommentsSectionProps) {
  const { data: session } = useSession();
  // Temporarily disable user profile to avoid database schema issues
  const userProfile = null; // const { profile: userProfile } = useUserProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Comment creation state
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);

  // Delete state
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    commentId: string;
    isReply: boolean;
    parentCommentId?: string;
  } | null>(null);

  // Fetch comments from API
  const fetchComments = useCallback(async (pageToken?: string, append = false) => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        id: videoId,
        maxResults: '20',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`/api/youtube/comments?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch comments');
      }

      const data: CommentsResponse = result.data;

      if (append) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }

      setNextPageToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
      setError(errorMessage);
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  // Load initial comments when videoId changes
  useEffect(() => {
    if (videoId) {
      setComments([]);
      setNextPageToken(undefined);
      setHasMore(true);
      setExpandedReplies(new Set());
      fetchComments();
    }
  }, [videoId, fetchComments]);

  // Load more comments
  const loadMoreComments = () => {
    if (nextPageToken && !loading) {
      fetchComments(nextPageToken, true);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Post new comment
  const postComment = async () => {
    if (!session || !newComment.trim()) return;

    setPostingComment(true);
    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          text: newComment.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to post comment');
      }

      // Add new comment to the top of the list
      setComments(prev => [result.data, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post comment';
      toast.error(errorMessage);
      console.error('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  // Post reply to comment
  const postReply = async (parentCommentId: string) => {
    if (!session || !replyText.trim()) return;

    setPostingReply(true);
    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          text: replyText.trim(),
          parentCommentId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to post reply');
      }

      // Add reply to the parent comment
      setComments(prev => prev.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), result.data],
          };
        }
        return comment;
      }));

      // Expand replies to show the new reply
      setExpandedReplies(prev => new Set([...prev, parentCommentId]));

      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post reply';
      toast.error(errorMessage);
      console.error('Error posting reply:', err);
    } finally {
      setPostingReply(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (commentId: string, isReply = false, parentCommentId?: string) => {
    setDeleteConfirmation({ commentId, isReply, parentCommentId });
  };

  // Delete comment
  const deleteComment = async () => {
    if (!session || !deleteConfirmation) return;

    const { commentId, isReply, parentCommentId } = deleteConfirmation;
    setDeletingComment(commentId);

    try {
      const response = await fetch(`/api/youtube/comments/${commentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        // Handle specific YouTube API errors
        if (result.error?.includes('forbidden') || result.error?.includes('403')) {
          throw new Error('You can only delete your own comments');
        } else if (result.error?.includes('not found') || result.error?.includes('404')) {
          throw new Error('Comment not found or already deleted');
        } else {
          throw new Error(result.error || 'Failed to delete comment');
        }
      }

      // Update the UI optimistically
      if (isReply && parentCommentId) {
        // Remove reply from parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: comment.replies?.filter(reply => reply.id !== commentId) || [],
            };
          }
          return comment;
        }));
      } else {
        // Remove top-level comment
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }

      toast.success('Comment deleted successfully!');
      setDeleteConfirmation(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      toast.error(errorMessage);
      console.error('Error deleting comment:', err);

      // If deletion failed, we might want to refresh comments to get the current state
      if (errorMessage.includes('not found')) {
        // Comment might have been deleted elsewhere, refresh the list
        fetchComments();
      }
    } finally {
      setDeletingComment(null);
    }
  };

  // Check if user can delete a comment (must be their own)
  const canDeleteComment = (comment: Comment) => {

    //console.log("User Profile:", userProfile);

    if (!session) {
      console.log("❌ No session - cannot delete");
      return false;
    }


    // Method 1: Check if the comment author's channel ID matches the user's YouTube channel ID
    // This is the most reliable method when both IDs are available
    if (session.youtubeChannelId && comment.authorChannelId) {
      const canDelete = session.youtubeChannelId === comment.authorChannelId;
      /* console.log("✅ Channel ID match check:", {
         userChannelId: session.youtubeChannelId,
         commentChannelId: comment.authorChannelId,
         match: canDelete
       });*/

      return canDelete;
    }


  };

  // Format relative time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  // Render individual comment
  const renderComment = (comment: Comment, isReply = false, parentCommentId?: string) => (
    <div
      key={comment.id}
      className={`flex gap-3 ${isReply ? 'ml-8 mt-2 border-l-2 border-gray-200 pl-4' : 'mb-4'}`}
    >
      <div className="flex-shrink-0">
        {comment.authorProfileImageUrl ? (
          <Image
            src={comment.authorProfileImageUrl}
            alt={comment.authorDisplayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {comment.authorDisplayName}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(comment.publishedAt)}
          </span>
        </div>

        <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words">
          {comment.textDisplay}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ThumbsUp className="w-3 h-3" />
            <span>{comment.likeCount}</span>
          </div>

          {/* Reply button for top-level comments */}
          {!isReply && session && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}

          {/* Delete button for own comments */}
          {session && canDeleteComment(comment) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => showDeleteConfirmation(comment.id, isReply, parentCommentId)}
              disabled={deletingComment === comment.id}
              className="text-xs text-red-600 hover:text-red-800 p-0 h-auto"
              title="Delete your comment"
            >
              {deletingComment === comment.id ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              Delete
            </Button>
          )}

          {/* Debug info for development - remove in production */}


          {!isReply && comment.replies && comment.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleReplies(comment.id)}
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Reply input */}
        {!isReply && replyingTo === comment.id && session && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px] resize-none"
              maxLength={10000}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => postReply(comment.id)}
                disabled={!replyText.trim() || postingReply}
              >
                {postingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Reply
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {!isReply && comment.replies && expandedReplies.has(comment.id) && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true, comment.id))}
          </div>
        )}
      </div>
    </div>
  );

  if (!videoId) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Select a video to view comments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {comments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Comment creation form */}
        {session && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
              {getUserAvatar(userProfile, session) ? (
                <Image
                  src={getUserAvatar(userProfile, session)!}
                  alt={getUserDisplayName(userProfile, session)}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {getUserDisplayName(userProfile, session)}
              </span>
            </div>

            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[100px] resize-none"
              maxLength={10000}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {newComment.length}/10,000 characters
              </span>
              <Button
                onClick={postComment}
                disabled={!newComment.trim() || postingComment}
                size="sm"
              >
                {postingComment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {!session && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Sign in to post comments and interact with the community.
            </p>
          </div>
        )}

        {error && !error.includes('Comments are disabled') && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComments()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {loading && comments.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading comments...</span>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No comments found for this video</p>
          </div>
        )}

        {!loading && error && error.includes('Comments are disabled') && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 mb-2">Comments are disabled for this video</p>
            <p className="text-sm text-gray-500">The video creator has turned off comments.</p>
          </div>
        )}

        {/* Debug section - remove in production */}
        {process.env.NODE_ENV === 'development' && session && comments.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">🐛 Debug Info</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              <div><strong>Session:</strong> {session.user?.name} (Channel: {session.youtubeChannelId || 'None'})</div>
              <div><strong>Comments found:</strong> {comments.length}</div>
              <div><strong>Deletable comments:</strong> {comments.filter(c => canDeleteComment(c)).length}</div>
            </div>
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading more comments...
                    </>
                  ) : (
                    'Load More Comments'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteConfirmation?.isReply ? 'Reply' : 'Comment'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteConfirmation?.isReply ? 'reply' : 'comment'}?
              This action cannot be undone and will permanently remove it from YouTube.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation(null)}
              disabled={!!deletingComment}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteComment}
              disabled={!!deletingComment}
            >
              {deletingComment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {deleteConfirmation?.isReply ? 'Reply' : 'Comment'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}