'use client';

import { useState } from 'react';
import { fetchVideoDetails, fetchVideoComments } from '@/lib/utils/youtube-helpers';
import { VideoDetails, Comment } from '@/lib/types';

export default function YouTubeAPITest() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default to Rick Roll
  const [loading, setLoading] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testVideoDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await fetchVideoDetails(videoId);
      setVideoDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video details');
    } finally {
      setLoading(false);
    }
  };

  const testComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchVideoComments(videoId, 5);
      setComments(result.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">YouTube API Test</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="videoId" className="block text-sm font-medium text-gray-700 mb-2">
              Video ID or URL:
            </label>
            <input
              id="videoId"
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter YouTube video ID or URL"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testVideoDetails}
              disabled={loading || !videoId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Test Video Details'}
            </button>
            
            <button
              onClick={testComments}
              disabled={loading || !videoId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Test Comments'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {videoDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Video Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Title:</strong> {videoDetails.title}</p>
                <p><strong>Channel:</strong> {videoDetails.channelTitle}</p>
                <p><strong>Published:</strong> {new Date(videoDetails.publishedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p><strong>Views:</strong> {formatNumber(videoDetails.statistics.viewCount)}</p>
                <p><strong>Likes:</strong> {formatNumber(videoDetails.statistics.likeCount)}</p>
                <p><strong>Comments:</strong> {formatNumber(videoDetails.statistics.commentCount)}</p>
              </div>
            </div>
            
            {videoDetails.thumbnails.length > 0 && (
              <div className="mt-4">
                <img
                  src={videoDetails.thumbnails[0].url}
                  alt={videoDetails.title}
                  className="w-48 h-auto rounded-md"
                />
              </div>
            )}
            
            <div className="mt-4">
              <p><strong>Description:</strong></p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                {videoDetails.description.substring(0, 300)}
                {videoDetails.description.length > 300 && '...'}
              </p>
            </div>
          </div>
        )}

        {comments.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Comments ({comments.length})</h3>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <img
                      src={comment.authorProfileImageUrl}
                      alt={comment.authorDisplayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.authorDisplayName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          👍 {comment.likeCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.textDisplay}</p>
                      {comment.replies && comment.replies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.replies.length} replies
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}