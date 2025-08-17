import YouTubeAPITest from '@/components/test/youtube-api-test';

export default function TestYouTubePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">YouTube API Integration Test</h1>
        <YouTubeAPITest />
      </div>
    </div>
  );
}