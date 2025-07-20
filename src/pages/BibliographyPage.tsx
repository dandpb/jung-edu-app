import React, { useState } from 'react';
import { Module, Bibliography, Film } from '../types';
import { Book, Film as FilmIcon, ExternalLink, Calendar, User } from 'lucide-react';

interface BibliographyPageProps {
  modules: Module[];
}

const BibliographyPage: React.FC<BibliographyPageProps> = ({ modules }) => {
  const [activeTab, setActiveTab] = useState<'books' | 'films'>('books');

  const allBibliography: Bibliography[] = modules.reduce((acc, module) => {
    if (module.content.bibliography) {
      return [...acc, ...module.content.bibliography];
    }
    return acc;
  }, [] as Bibliography[]);

  const allFilms: Film[] = modules.reduce((acc, module) => {
    if (module.content.films) {
      return [...acc, ...module.content.films];
    }
    return acc;
  }, [] as Film[]);

  const uniqueBibliography = Array.from(
    new Map(allBibliography.map(item => [item.id, item])).values()
  );

  const uniqueFilms = Array.from(
    new Map(allFilms.map(item => [item.id, item])).values()
  );

  const sortedBibliography = [...uniqueBibliography].sort((a, b) => b.year - a.year);
  const sortedFilms = [...uniqueFilms].sort((a, b) => b.year - a.year);

  const getBibliographyIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📚';
      case 'article':
        return '📄';
      case 'journal':
        return '📰';
      default:
        return '📖';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
          Recursos e Referências
        </h1>
        <p className="text-gray-600">
          Explore livros, artigos e filmes relacionados à psicologia analítica de Jung
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('books')}
            className={`
              flex items-center space-x-2 py-3 border-b-2 font-medium text-sm
              transition-colors duration-200
              ${activeTab === 'books'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Book className="w-4 h-4" />
            <span>Livros e Artigos</span>
            <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {uniqueBibliography.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('films')}
            className={`
              flex items-center space-x-2 py-3 border-b-2 font-medium text-sm
              transition-colors duration-200
              ${activeTab === 'films'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <FilmIcon className="w-4 h-4" />
            <span>Filmes</span>
            <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {uniqueFilms.length}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === 'books' && (
        <div className="space-y-4">
          {sortedBibliography.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Nenhuma entrada bibliográfica disponível ainda.
            </p>
          ) : (
            sortedBibliography.map(item => (
              <div key={item.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl mt-1">{getBibliographyIcon(item.type)}</span>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {item.authors.join(', ')}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {item.year}
                      </span>
                      <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                        {item.type}
                      </span>
                    </div>
                    
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver Recurso
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'films' && (
        <div className="space-y-4">
          {sortedFilms.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Nenhuma entrada de filme disponível ainda.
            </p>
          ) : (
            sortedFilms.map(film => (
              <div key={film.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl mt-1">🎬</span>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {film.title}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {film.director}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {film.year}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{film.relevance}</p>
                    
                    {film.trailer && (
                      <a
                        href={film.trailer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Assistir Trailer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Pontos de Partida Recomendados
        </h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• <strong>Memórias, Sonhos, Reflexões</strong> - A autobiografia de Jung</p>
          <p>• <strong>O Homem e Seus Símbolos</strong> - Última obra de Jung, escrita para o público geral</p>
          <p>• <strong>O Livro Vermelho</strong> - Exploração pessoal de Jung de seu inconsciente</p>
          <p>• <strong>Tipos Psicológicos</strong> - Teoria de Jung sobre tipos de personalidade</p>
        </div>
      </div>
    </div>
  );
};

export default BibliographyPage;