'use client';

import { useState } from 'react';
import { Note, APIResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Hash, 
  Edit3, 
  Trash2, 
  X, 
  Loader2,
  Save,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  note: Note;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
  className?: string;
  showVideoId?: boolean;
}

export function NoteCard({ 
  note, 
  onNoteUpdated, 
  onNoteDeleted, 
  className,
  showVideoId = false 
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTags, setEditTags] = useState<string[]>(note.tags || []);
  const [editTagInput, setEditTagInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add tag to edit form
  const addTag = () => {
    const tag = editTagInput.trim();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setEditTagInput('');
    }
  };

  // Remove tag from edit form
  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Start editing
  const startEditing = () => {
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditTagInput('');
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditTagInput('');
    setIsEditing(false);
  };

  // Update note
  const updateNote = async () => {
    if (!editContent.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
          tags: editTags,
        }),
      });

      const result: APIResponse<Note> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update note');
      }

      setIsEditing(false);
      
      if (onNoteUpdated && result.data) {
        onNoteUpdated(result.data);
      }

      toast.success('Note updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      toast.error(errorMessage);
      console.error('Error updating note:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Delete note
  const deleteNote = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete note');
      }

      if (onNoteDeleted) {
        onNoteDeleted(note.id);
      }

      toast.success('Note deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      toast.error(errorMessage);
      console.error('Error deleting note:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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

  return (
    <>
      <div className={`p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatTime(note.createdAt.toString())}</span>
            {note.updatedAt !== note.createdAt && (
              <span className="text-xs">(edited {formatTime(note.updatedAt.toString())})</span>
            )}
            {showVideoId && (
              <Badge variant="outline" className="text-xs">
                Video: {note.videoId.slice(-8)}
              </Badge>
            )}
          </div>

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreVertical className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={startEditing}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={10000}
            />
            <div className="text-xs text-gray-500 text-right">
              {editContent.length}/10,000 characters
            </div>

            {/* Tags editing */}
            <div className="space-y-2">
              <Input
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={handleTagKeyPress}
                placeholder="Add tags (press Enter or comma to add)"
                className="text-sm"
              />
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editTags.map(tag => (
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

            {/* Edit actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={updateNote}
                disabled={!editContent.trim() || updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={updating}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Note content */}
            <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap break-words">
              {note.content}
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteNote}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}