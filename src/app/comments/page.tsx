'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, ThumbsUp, Reply, User } from 'lucide-react';
import { fetchVideoComments } from '@/lib/utils/youtube-helpers';
import { Comment } from '@/lib/types';
import { formatPublishedDate } from '@/lib/utils/youtube-helpers';

export default function CommentsPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const handleFetchComments = async (pageToken?: string) => {
    if (!videoUrl.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchVideoComments(videoUrl, 20, pageToken);
      
      if (pageToken) {
        // Append to existing comments for pagination
        setComments(prev => [...prev, ...result.comments]);
      } else {
        // Replace comments for new video
        setComments(result.comments);
      }
      
      setNextPageToken(result.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = () => {
    if (nextPageToken) {
      handleFetchComments(nextPageToken);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Comment Management</h1>
        <p className="text-muted-foreground">
          View and manage comments on your YouTube videos.
        </p>
      </div>

      {/* Video URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Load Video Comments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="videoUrl">YouTube Video URL or ID</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFetchComments()}
              />
              <Button onClick={() => handleFetchComments()} disabled={loading || !videoUrl.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load Comments'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Display */}
      {comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex space-x-3">
                  <img
                    src={comment.authorProfileImageUrl}
                    alt={comment.authorDisplayName}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{comment.authorDisplayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPublishedDate(comment.publishedAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.textDisplay}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{comment.likeCount}</span>
                      </div>
                      
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Reply className="h-3 w-3" />
                          <span>{comment.replies.length} replies</span>
                        </div>
                      )}
                      
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        Reply
                      </Button>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-6 mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3">
                            <img
                              src={reply.authorProfileImageUrl}
                              alt={reply.authorDisplayName}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-xs">{reply.authorDisplayName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatPublishedDate(reply.publishedAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                {reply.textDisplay}
                              </p>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{reply.likeCount}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {nextPageToken && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreComments}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More Comments'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Empty State */}
      {comments.length === 0 && videoUrl && !loading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Comments Found</h3>
            <p className="text-muted-foreground">
              This video doesn&apos;t have any comments yet, or comments are disabled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}