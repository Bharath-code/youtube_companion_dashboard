'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Note, APIResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Loader2, 
  StickyNote, 
  Plus, 
  Search, 
  Tag, 
  Edit3, 
  Trash2, 
  X,
  Calendar,
  Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NotesPanelProps {
  videoId?: string;
  className?: string;
}

interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function NotesPanel({ videoId, className }: NotesPanelProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    text: string;
    type: 'content' | 'tag';
    frequency: number;
    context?: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Note creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);

  // Note editing state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [updatingNote, setUpdatingNote] = useState(false);

  // Note deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);

  // Fetch notes from API
  const fetchNotes = async (page = 1, append = false) => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (videoId) {
        params.append('videoId', videoId);
      }

      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/notes?${params}`);
      const result: APIResponse<NotesResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notes');
      }

      const data = result.data!;

      if (append) {
        setNotes(prev => [...prev, ...data.notes]);
      } else {
        setNotes(data.notes);
      }

      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      setHasMore(data.pagination.hasNext);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes';
      setError(errorMessage);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available tags
  const fetchTags = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/notes/tags');
      const result: APIResponse<string[]> = await response.json();

      if (result.success && result.data) {
        setAvailableTags(result.data);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Fetch search suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (!session || !query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: '8',
        type: 'both',
      });

      const response = await fetch(`/api/notes/suggestions?${params}`);
      const result: APIResponse<Array<{
        text: string;
        type: 'content' | 'tag';
        frequency: number;
        context?: string;
      }>> = await response.json();

      if (result.success && result.data) {
        setSearchSuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
      }
    } catch (err) {
      console.error('Error fetching search suggestions:', err);
    }
  };

  // Debounced search suggestions
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for suggestions
    const timer = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
    
    setSearchDebounceTimer(timer);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: { text: string; type: 'content' | 'tag' }) => {
    if (suggestion.type === 'tag') {
      // Add as tag filter
      if (!selectedTags.includes(suggestion.text)) {
        setSelectedTags(prev => [...prev, suggestion.text]);
      }
      setSearchQuery('');
    } else {
      // Set as search query
      setSearchQuery(suggestion.text);
    }
    setShowSuggestions(false);
  };

  // Load initial notes and tags
  useEffect(() => {
    if (session) {
      setNotes([]);
      setCurrentPage(1);
      fetchNotes(1);
      fetchTags();
    }
  }, [session, videoId, searchQuery, selectedTags]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  // Load more notes
  const loadMoreNotes = () => {
    if (hasMore && !loading) {
      fetchNotes(currentPage + 1, true);
    }
  };

  // Add tag to input
  const addTag = (tags: string[], setTags: (tags: string[]) => void, tagInput: string, setTagInput: (input: string) => void) => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tags: string[], setTags: (tags: string[]) => void, tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagKeyPress = (
    e: React.KeyboardEvent,
    tags: string[],
    setTags: (tags: string[]) => void,
    tagInput: string,
    setTagInput: (input: string) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tags, setTags, tagInput, setTagInput);
    }
  };

  // Create new note
  const createNote = async () => {
    if (!session || !newNoteContent.trim()) return;

    if (!videoId) {
      toast.error('Please select a video first');
      return;
    }

    setCreatingNote(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          content: newNoteContent.trim(),
          tags: newNoteTags,
        }),
      });

      const result: APIResponse<Note> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create note');
      }

      // Add new note to the top of the list
      setNotes(prev => [result.data!, ...prev]);
      setTotalCount(prev => prev + 1);
      
      // Reset form
      setNewNoteContent('');
      setNewNoteTags([]);
      setNewTagInput('');
      setShowCreateForm(false);
      
      // Refresh tags list
      fetchTags();
      
      toast.success('Note created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      toast.error(errorMessage);
      console.error('Error creating note:', err);
    } finally {
      setCreatingNote(false);
    }
  };

  // Start editing note
  const startEditingNote = (note: Note) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditTagInput('');
  };

  // Update note
  const updateNote = async () => {
    if (!session || !editingNote || !editContent.trim()) return;

    setUpdatingNote(true);
    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
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

      // Update note in the list
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id ? result.data! : note
      ));
      
      // Reset editing state
      setEditingNote(null);
      setEditContent('');
      setEditTags([]);
      setEditTagInput('');
      
      // Refresh tags list
      fetchTags();
      
      toast.success('Note updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      toast.error(errorMessage);
      console.error('Error updating note:', err);
    } finally {
      setUpdatingNote(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!session) return;

    setDeletingNote(noteId);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete note');
      }

      // Remove note from the list
      setNotes(prev => prev.filter(note => note.id !== noteId));
      setTotalCount(prev => prev - 1);
      
      setDeleteConfirmation(null);
      toast.success('Note deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      toast.error(errorMessage);
      console.error('Error deleting note:', err);
    } finally {
      setDeletingNote(null);
    }
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Sign in to view and manage your notes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Notes
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            disabled={!videoId}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Search and Filter Section */}
        <div className="space-y-3">
          {/* Enhanced Search Input with Suggestions */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="pl-10"
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {suggestion.type === 'tag' ? (
                          <Tag className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Search className="w-3 h-3 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">{suggestion.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.frequency}
                        </Badge>
                      </div>
                      <Badge variant={suggestion.type === 'tag' ? 'default' : 'secondary'} className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </div>
                    {suggestion.context && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {suggestion.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(searchQuery || selectedTags.length > 0 || videoId) && (
            <div className="flex flex-wrap gap-2 text-sm">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{searchQuery}&quot;
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {videoId && (
                <Badge variant="secondary">
                  Current video only
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Notes List */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotes(1)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {loading && notes.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading notes...</span>
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            {videoId ? (
              <div>
                <p className="mb-2">No notes found for this video</p>
                <Button
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first note
                </Button>
              </div>
            ) : (
              <p>Select a video to view notes or create new ones</p>
            )}
          </div>
        )}

        {notes.length > 0 && (
          <div className="space-y-4">
            {notes.map(note => (
              <div
                key={note.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatTime(note.createdAt.toString())}</span>
                    {note.updatedAt !== note.createdAt && (
                      <span className="text-xs">(edited)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmation(note.id)}
                      disabled={deletingNote === note.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      {deletingNote === note.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap break-words">
                  {note.content}
                </div>

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
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMoreNotes}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading more notes...
                    </>
                  ) : (
                    'Load More Notes'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create Note Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Add a note for the current video. You can organize your notes with tags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note here..."
                className="min-h-[120px] resize-none"
                maxLength={10000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newNoteContent.length}/10,000 characters
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="space-y-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyPress(e, newNoteTags, setNewNoteTags, newTagInput, setNewTagInput)}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="text-sm"
                />
                {newNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newNoteTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(newNoteTags, setNewNoteTags, tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewNoteContent('');
                setNewNoteTags([]);
                setNewTagInput('');
              }}
              disabled={creatingNote}
            >
              Cancel
            </Button>
            <Button
              onClick={createNote}
              disabled={!newNoteContent.trim() || creatingNote}
            >
              {creatingNote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your note content and tags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your note here..."
                className="min-h-[120px] resize-none"
                maxLength={10000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {editContent.length}/10,000 characters
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="space-y-2">
                <Input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyPress(e, editTags, setEditTags, editTagInput, setEditTagInput)}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="text-sm"
                />
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(editTags, setEditTags, tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNote(null);
                setEditContent('');
                setEditTags([]);
                setEditTagInput('');
              }}
              disabled={updatingNote}
            >
              Cancel
            </Button>
            <Button
              onClick={updateNote}
              disabled={!editContent.trim() || updatingNote}
            >
              {updatingNote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
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
              onClick={() => setDeleteConfirmation(null)}
              disabled={!!deletingNote}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteNote(deleteConfirmation!)}
              disabled={!!deletingNote}
            >
              {deletingNote ? (
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
    </Card>
  );
}