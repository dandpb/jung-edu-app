import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Bibliography, Film } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Book, 
  Film as FilmIcon,
  Search,
  Filter
} from 'lucide-react';

const AdminResources: React.FC = () => {
  const { modules, updateModules } = useAdmin();
  const [activeTab, setActiveTab] = useState<'bibliography' | 'films'>('bibliography');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<{ type: 'bibliography' | 'films', moduleId: string, itemId: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newBibliography, setNewBibliography] = useState<Bibliography>({
    id: '',
    title: '',
    author: '',
    year: new Date().getFullYear(),
    type: 'book'
  });

  const [newFilm, setNewFilm] = useState<Film>({
    id: '',
    title: '',
    director: '',
    year: new Date().getFullYear(),
    relevance: ''
  });

  const getAllBibliography = () => {
    const allBibliography: Array<Bibliography & { moduleId: string, moduleTitle: string }> = [];
    modules.forEach(module => {
      module.content.bibliography?.forEach(book => {
        allBibliography.push({
          ...book,
          moduleId: module.id,
          moduleTitle: module.title
        });
      });
    });
    return allBibliography;
  };

  const getAllFilms = () => {
    const allFilms: Array<Film & { moduleId: string, moduleTitle: string }> = [];
    modules.forEach(module => {
      module.content.films?.forEach(film => {
        allFilms.push({
          ...film,
          moduleId: module.id,
          moduleTitle: module.title
        });
      });
    });
    return allFilms;
  };

  const filteredBibliography = getAllBibliography().filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || book.moduleId === filterModule;
    return matchesSearch && matchesModule;
  });

  const filteredFilms = getAllFilms().filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         film.director.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || film.moduleId === filterModule;
    return matchesSearch && matchesModule;
  });

  const handleAddBibliography = (moduleId: string) => {
    const bibliography: Bibliography = {
      ...newBibliography,
      id: `bib-${Date.now()}`
    };

    updateModules(modules.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            content: {
              ...module.content,
              bibliography: [...(module.content.bibliography || []), bibliography]
            }
          }
        : module
    ));

    setNewBibliography({
      id: '',
      title: '',
      author: '',
      year: new Date().getFullYear(),
      type: 'book'
    });
    setShowAddForm(false);
  };

  const handleAddFilm = (moduleId: string) => {
    const film: Film = {
      ...newFilm,
      id: `film-${Date.now()}`
    };

    updateModules(modules.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            content: {
              ...module.content,
              films: [...(module.content.films || []), film]
            }
          }
        : module
    ));

    setNewFilm({
      id: '',
      title: '',
      director: '',
      year: new Date().getFullYear(),
      relevance: ''
    });
    setShowAddForm(false);
  };

  const handleUpdateBibliography = (moduleId: string, itemId: string, updates: Partial<Bibliography>) => {
    updateModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            content: {
              ...module.content,
              bibliography: (module.content.bibliography || []).map(book =>
                book.id === itemId ? { ...book, ...updates } : book
              )
            }
          }
        : module
    ));
  };

  const handleUpdateFilm = (moduleId: string, itemId: string, updates: Partial<Film>) => {
    updateModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            content: {
              ...module.content,
              films: (module.content.films || []).map(film =>
                film.id === itemId ? { ...film, ...updates } : film
              )
            }
          }
        : module
    ));
  };

  const handleDeleteBibliography = (moduleId: string, itemId: string) => {
    if (window.confirm('Are you sure you want to delete this bibliography entry?')) {
      updateModules(modules.map(module =>
        module.id === moduleId
          ? {
              ...module,
              content: {
                ...module.content,
                bibliography: (module.content.bibliography || []).filter(book => book.id !== itemId)
              }
            }
          : module
      ));
    }
  };

  const handleDeleteFilm = (moduleId: string, itemId: string) => {
    if (window.confirm('Are you sure you want to delete this film entry?')) {
      updateModules(modules.map(module =>
        module.id === moduleId
          ? {
              ...module,
              content: {
                ...module.content,
                films: (module.content.films || []).filter(film => film.id !== itemId)
              }
            }
          : module
      ));
    }
  };

  const tabs = [
    { id: 'bibliography', label: 'Bibliography', icon: Book },
    { id: 'films', label: 'Films', icon: FilmIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Manage Resources
          </h1>
          <p className="text-gray-600">
            Manage bibliography and film resources across all modules
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === 'bibliography' ? 'Book' : 'Film'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'bibliography' | 'films')}
                className={`
                  flex items-center space-x-2 py-3 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'bibliography' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBibliography.map((book) => (
            <div key={`${book.moduleId}-${book.id}`} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {book.title}
                  </h3>
                  <p className="text-gray-600">
                    by {book.author} ({book.year})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Module: {book.moduleTitle}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingItem({ type: 'bibliography', moduleId: book.moduleId, itemId: book.id })}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBibliography(book.moduleId, book.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Type:</strong> {book.type}</p>
                {book.url && <p><strong>URL:</strong> <a href={book.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">{book.url}</a></p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'films' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFilms.map((film) => (
            <div key={`${film.moduleId}-${film.id}`} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {film.title}
                  </h3>
                  <p className="text-gray-600">
                    Directed by {film.director} ({film.year})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Module: {film.moduleTitle}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingItem({ type: 'films', moduleId: film.moduleId, itemId: film.id })}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFilm(film.moduleId, film.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Relevance:</strong> {film.relevance || 'Not specified'}</p>
                {film.trailer && <p><strong>Trailer:</strong> {film.trailer}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Add {activeTab === 'bibliography' ? 'Bibliography' : 'Film'}
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Module
                </label>
                <select
                  value={filterModule === 'all' ? '' : filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a module...</option>
                  {modules.map(module => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'bibliography' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={newBibliography.title}
                        onChange={(e) => setNewBibliography({ ...newBibliography, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        value={newBibliography.author}
                        onChange={(e) => setNewBibliography({ ...newBibliography, author: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        value={newBibliography.year}
                        onChange={(e) => setNewBibliography({ ...newBibliography, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={newBibliography.type}
                        onChange={(e) => setNewBibliography({ ...newBibliography, type: e.target.value as 'book' | 'article' | 'journal' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="book">Book</option>
                        <option value="article">Article</option>
                        <option value="journal">Journal</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={newFilm.title}
                        onChange={(e) => setNewFilm({ ...newFilm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Director *
                      </label>
                      <input
                        type="text"
                        value={newFilm.director}
                        onChange={(e) => setNewFilm({ ...newFilm, director: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        value={newFilm.year}
                        onChange={(e) => setNewFilm({ ...newFilm, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relevance to Jung's Concepts *
                    </label>
                    <textarea
                      value={newFilm.relevance}
                      onChange={(e) => setNewFilm({ ...newFilm, relevance: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="How is this film relevant to Jung's theories?"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (filterModule && filterModule !== 'all') {
                      if (activeTab === 'bibliography') {
                        handleAddBibliography(filterModule);
                      } else {
                        handleAddFilm(filterModule);
                      }
                    }
                  }}
                  disabled={!filterModule || filterModule === 'all'}
                  className="btn-primary"
                >
                  Add {activeTab === 'bibliography' ? 'Book' : 'Film'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;