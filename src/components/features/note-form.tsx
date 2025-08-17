'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Note, APIResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, X, Hash, User } from 'lucide-react';
import { toast } from 'sonner';
import { getUserDisplayName, getUserAvatar } from '@/lib/utils/user-display';
import { useUserProfile } from '@/hooks/use-user-profile';

interface NoteFormProps {
  videoId: string;
  onNoteCreated?: (note: Note) => void;
  className?: string;
  compact?: boolean;
}

export function NoteForm({ videoId, onNoteCreated, className, compact = false }: NoteFormProps) {
  const { data: session } = useSession();
  const { profile: userProfile } = useUserProfile();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  // Add tag
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Create note
  const createNote = async () => {
    if (!session || !content.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          content: content.trim(),
          tags,
        }),
      });

      const result: APIResponse<Note> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create note');
      }

      // Reset form
      setContent('');
      setTags([]);
      setTagInput('');
      
      if (compact) {
        setExpanded(false);
      }

      // Notify parent component
      if (onNoteCreated && result.data) {
        onNoteCreated(result.data);
      }

      toast.success('Note created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      toast.error(errorMessage);
      console.error('Error creating note:', err);
    } finally {
      setCreating(false);
    }
  };

  // Cancel and reset form
  const cancelForm = () => {
    setContent('');
    setTags([]);
    setTagInput('');
    if (compact) {
      setExpanded(false);
    }
  };

  if (!session) {
    return null;
  }

  if (compact && !expanded) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Button
            onClick={() => setExpanded(true)}
            variant="outline"
            className="w-full flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Plus className="w-4 h-4" />
            Add a note for this video
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Note
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          {getUserAvatar(userProfile, session) ? (
            <img
              src={getUserAvatar(userProfile, session)!}
              alt={getUserDisplayName(userProfile, session)}
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

        {/* Content input */}
        <div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            className="min-h-[100px] resize-none"
            maxLength={10000}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {content.length}/10,000 characters
          </div>
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tags (optional)</label>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyPress}
            placeholder="Add tags (press Enter or comma to add)"
            className="text-sm"
          />
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-600" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            Note will be saved for this video
          </div>
          <div className="flex items-center gap-2">
            {(compact || content || tags.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={cancelForm}
                disabled={creating}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={createNote}
              disabled={!content.trim() || creating}
              size="sm"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}