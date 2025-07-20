import React, { useState, useCallback } from 'react';
import { Module } from '../types';
import InteractiveMindMap from '../components/mindmap/InteractiveMindMap';
import ModuleDeepDiveMindMap from '../components/mindmap/ModuleDeepDiveMindMap';
import { modules as defaultModules } from '../data/modules';
import { LayoutType } from '../services/mindmap/mindMapLayouts';
import { Layers, ChevronRight, Brain } from 'lucide-react';

interface EnhancedMindMapPageProps {
  modules?: Module[];
}

const EnhancedMindMapPage: React.FC<EnhancedMindMapPageProps> = ({ 
  modules = defaultModules 
}) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);

  const handleNodeClick = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setSelectedModule(module);
      setShowDeepDive(true);
    }
  }, [modules]);

  const handleBack = useCallback(() => {
    setShowDeepDive(false);
    setSelectedModule(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {showDeepDive && selectedModule ? selectedModule.title : 'Mapa Mental Educacional de Jung'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {showDeepDive 
                    ? 'Mapa conceitual gerado por IA para compreensão mais profunda' 
                    : 'Clique em qualquer módulo para explorar seus conceitos em detalhes'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {showDeepDive && selectedModule && (
                <div className="flex items-center text-sm text-gray-600">
                  <Layers className="w-4 h-4 mr-1" />
                  <span>Modo de Exploração Profunda</span>
                </div>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          {showDeepDive && selectedModule && (
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <button 
                onClick={handleBack}
                className="hover:text-primary-600 transition-colors"
              >
                Visão Geral
              </button>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 font-medium">{selectedModule.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1" style={{ height: 'calc(100vh - 120px)' }}>
        {showDeepDive && selectedModule ? (
          <ModuleDeepDiveMindMap 
            module={selectedModule} 
            onBack={handleBack}
          />
        ) : (
          <div className="h-full relative">
            <InteractiveMindMap
              modules={modules}
              onNodeClick={handleNodeClick}
              showMiniMap={true}
              showControls={true}
              initialLayout={LayoutType.HIERARCHICAL}
            />
            
            {/* Instruction Overlay */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg px-6 py-3 flex items-center">
                <Brain className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">
                  Clique em qualquer módulo para gerar um mapa conceitual detalhado com IA
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Info */}
      {!showDeepDive && (
        <div className="absolute top-24 right-6 w-80">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              🧠 Explorações Profundas com IA
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Clique em qualquer módulo para gerar um mapa conceitual detalhado</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>IA analisa o conteúdo para criar estruturas educacionais</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Mostra relações entre conceitos</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Inclui exemplos e caminhos de aprendizagem</span>
              </li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {process.env.REACT_APP_OPENAI_API_KEY ? '✅ API OpenAI configurada' : '⚠️ Usando modo demonstração (configure REACT_APP_OPENAI_API_KEY para recursos completos)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMindMapPage;