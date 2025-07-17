import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Module } from '../types';
import { Search, BookOpen, FileText, Hash, ArrowRight } from 'lucide-react';

interface SearchPageProps {
  modules: Module[];
}

interface SearchResult {
  type: 'module' | 'section' | 'term' | 'content';
  moduleId: string;
  moduleTitle: string;
  title: string;
  content: string;
  matches: number;
}

const SearchPage: React.FC<SearchPageProps> = ({ modules }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    modules.forEach(module => {
      // Search in module title and description
      if (module.title.toLowerCase().includes(query) || 
          module.description.toLowerCase().includes(query)) {
        results.push({
          type: 'module',
          moduleId: module.id,
          moduleTitle: module.title,
          title: module.title,
          content: module.description,
          matches: (module.title.toLowerCase().match(new RegExp(query, 'g')) || []).length +
                   (module.description.toLowerCase().match(new RegExp(query, 'g')) || []).length
        });
      }

      // Search in introduction
      if (module.content.introduction.toLowerCase().includes(query)) {
        results.push({
          type: 'content',
          moduleId: module.id,
          moduleTitle: module.title,
          title: 'Introduction',
          content: module.content.introduction,
          matches: (module.content.introduction.toLowerCase().match(new RegExp(query, 'g')) || []).length
        });
      }

      // Search in sections
      module.content.sections.forEach(section => {
        if (section.title.toLowerCase().includes(query) ||
            section.content.toLowerCase().includes(query)) {
          results.push({
            type: 'section',
            moduleId: module.id,
            moduleTitle: module.title,
            title: section.title,
            content: section.content,
            matches: (section.title.toLowerCase().match(new RegExp(query, 'g')) || []).length +
                     (section.content.toLowerCase().match(new RegExp(query, 'g')) || []).length
          });
        }

        // Search in key terms
        section.keyTerms?.forEach(term => {
          if (term.term.toLowerCase().includes(query) ||
              term.definition.toLowerCase().includes(query)) {
            results.push({
              type: 'term',
              moduleId: module.id,
              moduleTitle: module.title,
              title: term.term,
              content: term.definition,
              matches: (term.term.toLowerCase().match(new RegExp(query, 'g')) || []).length +
                       (term.definition.toLowerCase().match(new RegExp(query, 'g')) || []).length
            });
          }
        });
      });
    });

    // Sort by relevance (number of matches)
    return results.sort((a, b) => b.matches - a.matches);
  }, [searchQuery, modules]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark> : 
        part
    );
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'module':
        return <BookOpen className="w-5 h-5 text-primary-600" />;
      case 'section':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'term':
        return <Hash className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
          Search
        </h1>
        <p className="text-gray-600">
          Search across all modules, sections, and key terms
        </p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Search for concepts, terms, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found {searchResults.length} results for "{searchQuery}"
          </p>
        </div>
      )}

      {searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div
              key={`${result.type}-${result.moduleId}-${index}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/module/${result.moduleId}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getResultIcon(result.type)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {highlightText(result.title, searchQuery)}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                        {result.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">
                      in {result.moduleTitle}
                    </p>
                    
                    <p className="text-gray-700 line-clamp-2">
                      {highlightText(result.content, searchQuery)}
                    </p>
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No results found for "{searchQuery}"
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Try searching for different keywords or check your spelling
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Start typing to search across all content
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;