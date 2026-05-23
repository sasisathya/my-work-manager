'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isSecret?: boolean; // Mark note as containing sensitive info
  isVisible?: boolean; // Track if secret content is currently visible (persists across sessions)
}

export default function TasksPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes/list');
      const data = await response.json();

      if (response.ok) {
        setNotes(data.notes || []);
      }
    } catch (err: any) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: 'New Note',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        setNotes([...notes, newNote]);
        setSuccess('Note created!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err: any) {
      setError('Failed to create note');
    }
  };

  const saveNote = async (note: Note) => {
    try {
      setSaving(note.id);
      const updatedNote = {
        ...note,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
        setSuccess('Note saved!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err: any) {
      setError('Failed to save note');
    } finally {
      setSaving(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch('/api/notes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId }),
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
        setSuccess('Note deleted!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err: any) {
      setError('Failed to delete note');
    }
  };

  const updateNoteTitle = (noteId: string, title: string) => {
    setNotes(notes.map(n => n.id === noteId ? { ...n, title } : n));
  };

  const updateNoteContent = (noteId: string, content: string) => {
    setNotes(notes.map(n => n.id === noteId ? { ...n, content } : n));
  };

  const toggleSecretVisibility = async (note: Note) => {
    const updatedNote = {
      ...note,
      isSecret: !note.isSecret || note.isSecret, // Keep or set secret mode
      isVisible: note.isSecret ? !note.isVisible : false, // Toggle visibility if already secret, hide if new secret
      updatedAt: new Date().toISOString(),
    };

    // If not secret yet, mark as secret and hide
    if (!note.isSecret) {
      updatedNote.isSecret = true;
      updatedNote.isVisible = false;
    }

    // Save the updated note
    try {
      setSaving(note.id);
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
      }
    } catch (err: any) {
      setError('Failed to update note');
    } finally {
      setSaving(null);
    }
  };

  const maskContent = (content: string) => {
    // Preserve line breaks and structure
    return content.split('\n').map(line => {
      return line.split('').map(() => 'X').join('');
    }).join('\n');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-gray-900 border border-gray-600 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-gray-200 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gray-900 border border-gray-600 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StickyNote className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">My Sticky Notes</h1>
          <span className="text-sm text-gray-400">({notes.length})</span>
        </div>
        <Button
          onClick={createNote}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
          <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg mb-4">No notes yet</p>
          <p className="text-gray-500 text-sm mb-6">Create your first sticky note to get started</p>
          <Button
            onClick={createNote}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
              style={{ minHeight: '280px' }}
            >
              {/* Note Header */}
              <div className="mb-3">
                <Input
                  value={note.title}
                  onChange={(e) => updateNoteTitle(note.id, e.target.value)}
                  onBlur={() => saveNote(note)}
                  className="bg-transparent border-0 border-b-2 border-yellow-400 text-gray-900 font-bold text-lg p-2 focus:outline-none focus:border-yellow-600"
                  placeholder="Note title..."
                />
              </div>

              {/* Note Content */}
              {note.isSecret && !note.isVisible ? (
                // Masked content for secret notes
                <div className="bg-transparent border-0 text-gray-800 resize-none focus:outline-none placeholder:text-gray-500 font-mono tracking-wider py-2 whitespace-pre-wrap break-words overflow-hidden"
                     style={{ minHeight: '140px' }}>
                  {maskContent(note.content)}
                </div>
              ) : (
                // Normal editable content
                <Textarea
                  value={note.content}
                  onChange={(e) => updateNoteContent(note.id, e.target.value)}
                  onBlur={() => saveNote(note)}
                  className="bg-transparent border-0 text-gray-800 resize-none focus:outline-none placeholder:text-gray-500"
                  style={{ minHeight: '140px' }}
                  placeholder="Write your note here..."
                />
              )}

              {/* Note Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-yellow-300">
                <span className="text-xs text-gray-600">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {/* Single Eye/Eye-Off Toggle Button */}
                  <Button
                    onClick={() => toggleSecretVisibility(note)}
                    disabled={saving === note.id}
                    className={`${
                      note.isSecret && !note.isVisible
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : note.isSecret && note.isVisible
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white px-3 py-1 rounded text-xs`}
                    title={
                      note.isSecret && !note.isVisible
                        ? 'Click to reveal secret'
                        : note.isSecret && note.isVisible
                        ? 'Click to hide secret'
                        : 'Mark as secret'
                    }
                  >
                    {note.isSecret && !note.isVisible ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>

                  <Button
                    onClick={() => saveNote(note)}
                    disabled={saving === note.id}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                  >
                    {saving === note.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    onClick={() => deleteNote(note.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
