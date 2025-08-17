'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Note } from '@/lib/types';

export default function TestNotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    videoId: 'dQw4w9WgXcQ', // Rick Roll video ID for testing
    content: '',
    tags: [] as string[],
  });

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data.notes);
      } else {
        setError(data.error || 'Failed to fetch notes');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote({ videoId: 'dQw4w9WgXcQ', content: '', tags: [] });
      } else {
        setError(data.error || 'Failed to create note');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(notes.filter(note => note.id !== noteId));
      } else {
        setError(data.error || 'Failed to delete note');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Notes API Test</h1>
        <p>Please sign in to test the notes API.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notes API Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Create Note</h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Video ID"
            value={newNote.videoId}
            onChange={(e) => setNewNote({ ...newNote, videoId: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Note content"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full p-2 border rounded h-24"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            onChange={(e) => setNewNote({ 
              ...newNote, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            })}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={createNote}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Note'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={fetchNotes}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Notes'}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Notes ({notes.length})</h2>
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes found. Create one or fetch existing notes.</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">Video ID: {note.videoId}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
                <p className="mb-2">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}