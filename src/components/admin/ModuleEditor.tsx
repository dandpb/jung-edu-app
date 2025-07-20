import React, { useState } from 'react';
import { Module, Section, Video, Bibliography, Film } from '../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Save,
  BookOpen,
  Video as VideoIcon,
  Library
} from 'lucide-react';
import QuizEditor from './QuizEditor';

interface ModuleEditorProps {
  module: Module;
  modules: Module[];
  onSave: (module: Module) => void;
  onCancel: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ module, modules, onSave, onCancel }) => {
  const [editedModule, setEditedModule] = useState<Module>(module);
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const handleSave = () => {
    // Validate required fields
    if (!editedModule.title.trim() || !editedModule.description.trim()) {
      return;
    }
    onSave(editedModule);
  };

  const updateModule = (updates: Partial<Module>) => {
    setEditedModule({ ...editedModule, ...updates });
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: 'Nova Seção',
      content: '',
      keyTerms: []
    };
    updateModule({
      content: {
        ...editedModule.content,
        sections: [...editedModule.content.sections, newSection]
      }
    });
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    updateModule({
      content: {
        ...editedModule.content,
        sections: editedModule.content.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        )
      }
    });
  };

  const deleteSection = (sectionId: string) => {
    updateModule({
      content: {
        ...editedModule.content,
        sections: editedModule.content.sections.filter(s => s.id !== sectionId)
      }
    });
  };

  const addVideo = () => {
    const newVideo: Video = {
      id: `video-${Date.now()}`,
      title: 'Novo Vídeo',
      youtubeId: '',
      description: '',
      duration: 0
    };
    updateModule({
      content: {
        ...editedModule.content,
        videos: [...(editedModule.content.videos || []), newVideo]
      }
    });
  };

  const updateVideo = (videoId: string, updates: Partial<Video>) => {
    updateModule({
      content: {
        ...editedModule.content,
        videos: editedModule.content.videos?.map(v =>
          v.id === videoId ? { ...v, ...updates } : v
        )
      }
    });
  };

  const deleteVideo = (videoId: string) => {
    updateModule({
      content: {
        ...editedModule.content,
        videos: editedModule.content.videos?.filter(v => v.id !== videoId)
      }
    });
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: BookOpen },
    { id: 'content', label: 'Conteúdo', icon: BookOpen },
    { id: 'videos', label: 'Vídeos', icon: VideoIcon },
    { id: 'quiz', label: 'Questionário', icon: BookOpen },
    { id: 'resources', label: 'Recursos', icon: Library }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            {module.id === editedModule.id ? 'Editar Módulo' : 'Criar Módulo'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="module-title" className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Módulo
                    </label>
                    <input
                      id="module-title"
                      type="text"
                      value={editedModule.title}
                      onChange={(e) => updateModule({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="module-icon" className="block text-sm font-medium text-gray-700 mb-2">
                      Ícone
                    </label>
                    <input
                      id="module-icon"
                      type="text"
                      value={editedModule.icon}
                      onChange={(e) => updateModule({ icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="📚"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="module-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="module-description"
                    value={editedModule.description}
                    onChange={(e) => updateModule({ description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="module-estimated-time" className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Estimado (minutos)
                    </label>
                    <input
                      id="module-estimated-time"
                      type="number"
                      value={editedModule.estimatedTime}
                      onChange={(e) => updateModule({ estimatedTime: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="module-difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                      Dificuldade
                    </label>
                    <select
                      id="module-difficulty"
                      value={editedModule.difficulty}
                      onChange={(e) => updateModule({ difficulty: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pré-requisitos
                  </label>
                  <div className="space-y-2">
                    {modules
                      .filter(m => m.id !== editedModule.id)
                      .map(m => (
                        <label key={m.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editedModule.prerequisites?.includes(m.id) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateModule({
                                  prerequisites: [...(editedModule.prerequisites || []), m.id]
                                });
                              } else {
                                updateModule({
                                  prerequisites: editedModule.prerequisites?.filter(id => id !== m.id)
                                });
                              }
                            }}
                            className="rounded text-primary-600"
                          />
                          <span className="text-sm text-gray-700">{m.title}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="module-introduction" className="block text-sm font-medium text-gray-700 mb-2">
                    Introdução
                  </label>
                  <textarea
                    id="module-introduction"
                    value={editedModule.content.introduction}
                    onChange={(e) => updateModule({
                      content: { ...editedModule.content, introduction: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Seções</h3>
                    <button
                      onClick={addSection}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Seção</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editedModule.content.sections.map((section, index) => {
                      const isExpanded = expandedSections.includes(section.id);
                      
                      return (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleSectionExpansion(section.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </button>
                              <span className="text-gray-500">#{index + 1}</span>
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Conteúdo
                                </label>
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                  rows={4}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Termos-Chave
                                </label>
                                <div className="space-y-2">
                                  {(section.keyTerms || []).map((keyTerm, termIndex) => (
                                    <div key={termIndex} className="border p-3 rounded-lg space-y-2">
                                      <input
                                        type="text"
                                        value={keyTerm.term}
                                        onChange={(e) => {
                                          const newKeyTerms = [...(section.keyTerms || [])];
                                          newKeyTerms[termIndex] = { ...keyTerm, term: e.target.value };
                                          updateSection(section.id, { keyTerms: newKeyTerms });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Digite o termo"
                                      />
                                      <input
                                        type="text"
                                        value={keyTerm.definition}
                                        onChange={(e) => {
                                          const newKeyTerms = [...(section.keyTerms || [])];
                                          newKeyTerms[termIndex] = { ...keyTerm, definition: e.target.value };
                                          updateSection(section.id, { keyTerms: newKeyTerms });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Digite a definição"
                                      />
                                      <button
                                        onClick={() => {
                                          const newKeyTerms = (section.keyTerms || []).filter((_, i) => i !== termIndex);
                                          updateSection(section.id, { keyTerms: newKeyTerms });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const newKeyTerms = [...(section.keyTerms || []), { term: '', definition: '' }];
                                      updateSection(section.id, { keyTerms: newKeyTerms });
                                    }}
                                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center space-x-1"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Adicionar Termo-Chave</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Vídeos</h3>
                  <button
                    onClick={addVideo}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Vídeo</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {editedModule.content.videos?.map((video) => (
                    <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título
                          </label>
                          <input
                            type="text"
                            value={video.title}
                            onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID do YouTube
                          </label>
                          <input
                            type="text"
                            value={video.youtubeId}
                            onChange={(e) => updateVideo(video.id, { youtubeId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="ex.: dQw4w9WgXcQ"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <textarea
                          value={video.description}
                          onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duração (segundos)
                          </label>
                          <input
                            type="number"
                            value={video.duration}
                            onChange={(e) => updateVideo(video.id, { duration: parseInt(e.target.value) })}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <QuizEditor
                quiz={editedModule.content.quiz}
                onUpdate={(quiz) => updateModule({
                  content: { ...editedModule.content, quiz }
                })}
              />
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Bibliografia</h3>
                    <button
                      onClick={() => {
                        const newBibliography: Bibliography = {
                          id: `bib-${Date.now()}`,
                          title: 'Novo Livro',
                          author: '',
                          year: new Date().getFullYear(),
                          type: 'book'
                        };
                        updateModule({
                          content: {
                            ...editedModule.content,
                            bibliography: [...(editedModule.content.bibliography || []), newBibliography]
                          }
                        });
                      }}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Livro</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(editedModule.content.bibliography || []).map((book) => (
                      <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Título
                            </label>
                            <input
                              type="text"
                              value={book.title}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  bibliography: (editedModule.content.bibliography || []).map(b =>
                                    b.id === book.id ? { ...b, title: e.target.value } : b
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Autor
                            </label>
                            <input
                              type="text"
                              value={book.author}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  bibliography: (editedModule.content.bibliography || []).map(b =>
                                    b.id === book.id ? { ...b, author: e.target.value } : b
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ano
                            </label>
                            <input
                              type="number"
                              value={book.year}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  bibliography: (editedModule.content.bibliography || []).map(b =>
                                    b.id === book.id ? { ...b, year: parseInt(e.target.value) } : b
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo
                            </label>
                            <select
                              value={book.type}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  bibliography: (editedModule.content.bibliography || []).map(b =>
                                    b.id === book.id ? { ...b, type: e.target.value as 'book' | 'article' | 'journal' } : b
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="book">Livro</option>
                              <option value="article">Artigo</option>
                              <option value="journal">Periódico</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end">
                          <button
                            onClick={() => updateModule({
                              content: {
                                ...editedModule.content,
                                bibliography: (editedModule.content.bibliography || []).filter(b => b.id !== book.id)
                              }
                            })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Filmes</h3>
                    <button
                      onClick={() => {
                        const newFilm: Film = {
                          id: `film-${Date.now()}`,
                          title: 'Novo Filme',
                          director: '',
                          year: new Date().getFullYear(),
                          relevance: ''
                        };
                        updateModule({
                          content: {
                            ...editedModule.content,
                            films: [...(editedModule.content.films || []), newFilm]
                          }
                        });
                      }}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Filme</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(editedModule.content.films || []).map((film) => (
                      <div key={film.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Título
                            </label>
                            <input
                              type="text"
                              value={film.title}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  films: (editedModule.content.films || []).map(f =>
                                    f.id === film.id ? { ...f, title: e.target.value } : f
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diretor
                            </label>
                            <input
                              type="text"
                              value={film.director}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  films: (editedModule.content.films || []).map(f =>
                                    f.id === film.id ? { ...f, director: e.target.value } : f
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ano
                            </label>
                            <input
                              type="number"
                              value={film.year}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  films: (editedModule.content.films || []).map(f =>
                                    f.id === film.id ? { ...f, year: parseInt(e.target.value) } : f
                                  )
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Relevância
                            </label>
                            <textarea
                              value={film.relevance}
                              onChange={(e) => updateModule({
                                content: {
                                  ...editedModule.content,
                                  films: (editedModule.content.films || []).map(f =>
                                    f.id === film.id ? { ...f, relevance: e.target.value } : f
                                  )
                                }
                              })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Como este filme é relevante para os conceitos de Jung?"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end">
                          <button
                            onClick={() => updateModule({
                              content: {
                                ...editedModule.content,
                                films: (editedModule.content.films || []).filter(f => f.id !== film.id)
                              }
                            })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Módulo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditor;