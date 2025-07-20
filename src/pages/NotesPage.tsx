import React, { useState } from 'react';
import { UserProgress, Module, Note } from '../types';
import { FileText, Calendar, Tag, Trash2, Edit2, Search } from 'lucide-react';
import NoteEditor from '../components/notes/NoteEditor';

interface NotesPageProps {
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
  modules: Module[];
}

const NotesPage: React.FC<NotesPageProps> = ({ userProgress, updateProgress, modules }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const filteredNotes = userProgress.notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || note.moduleId === selectedModule;
    return matchesSearch && matchesModule;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => b.timestamp - a.timestamp);

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = userProgress.notes.filter(note => note.id !== noteId);
    updateProgress({ notes: updatedNotes });
  };

  const handleEditNote = (noteId: string, newContent: string) => {
    const updatedNotes = userProgress.notes.map(note =>
      note.id === noteId ? { ...note, content: newContent, timestamp: Date.now() } : note
    );
    updateProgress({ notes: updatedNotes });
    setEditingNote(null);
  };

  const getModuleTitle = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.title || 'Unknown Module';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
          My Notes
        </h1>
        <p className="text-gray-600">
          All your learning notes in one place. Search, filter, and organize your thoughts.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar anotações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'} found
          </p>
        </div>
      </div>

      {sortedNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedModule !== 'all' 
              ? 'No notes found matching your criteria.'
              : 'No notes yet. Start by adding notes while studying modules!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map(note => {
            const module = modules.find(m => m.id === note.moduleId);
            
            return (
              <div key={note.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{module?.icon || '📝'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getModuleTitle(note.moduleId)}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(note.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mt-4">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {note.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingNote && (
        <NoteEditor
          onSave={(content) => handleEditNote(editingNote.id, content)}
          onCancel={() => setEditingNote(null)}
          moduleTitle={getModuleTitle(editingNote.moduleId)}
          initialContent={editingNote.content}
        />
      )}
    </div>
  );
};

export default NotesPage;