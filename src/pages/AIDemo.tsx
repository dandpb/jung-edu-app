import React from 'react';
import { Brain, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-600 rounded-full p-4">
              <Brain className="w-12 h-12 text-white" data-testid="lucide-brain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mapas Mentais com IA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experimente o futuro do conteúdo educacional com nosso gerador de mapas mentais com IA. 
            Clique em qualquer módulo para gerar mapas conceituais detalhados e estruturados automaticamente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Como Funciona
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Clique em Qualquer Módulo
                  </h3>
                  <p className="text-gray-600">
                    Navegue até o Mapa Mental IA e clique em qualquer módulo de psicologia de Jung
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    IA Analisa o Conteúdo
                  </h3>
                  <p className="text-gray-600">
                    Nossa IA extrai conceitos-chave, cria hierarquias e identifica relacionamentos
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Explore o Mapa Interativo
                  </h3>
                  <p className="text-gray-600">
                    Navegue pelos conceitos, veja exemplos e siga os caminhos de aprendizagem sugeridos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Recursos
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-1" />
                <span className="text-gray-700">Extração automática de conceitos</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-2" />
                <span className="text-gray-700">Organização hierárquica</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-3" />
                <span className="text-gray-700">Mapeamento visual de relacionamentos</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-4" />
                <span className="text-gray-700">Exemplos interativos</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-5" />
                <span className="text-gray-700">Caminhos de aprendizagem sugeridos</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" data-testid="lucide-sparkles-6" />
                <span className="text-gray-700">Geração em tempo real</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            to="/enhanced-mindmap"
            className="inline-flex items-center bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            Experimente Mapas Mentais com IA
            <ArrowRight className="w-5 h-5 ml-2" data-testid="lucide-arrow-right" />
          </Link>
          
          <p className="text-gray-600 mt-4">
            Ou experimente a <Link to="/minimap-demo" className="text-primary-600 hover:underline">demonstração de setores do minimapa</Link>
          </p>
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Opções de Configuração
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                🤖 Modo IA Completo (Recomendado)
              </h4>
              <p className="text-gray-600 mb-4">
                Obtenha a experiência completa de IA com análise avançada de conceitos e estruturas personalizadas.
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700">
                REACT_APP_OPENAI_API_KEY=your-key<br/>
                REACT_APP_OPENAI_MODEL=gpt-4
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                📝 Modo Demonstração
              </h4>
              <p className="text-gray-600 mb-4">
                Experimente o recurso com conteúdo pré-estruturado. Nenhuma chave de API necessária.
              </p>
              <div className="bg-green-50 rounded p-3 text-sm text-green-700">
                Pronto para usar! Nenhuma configuração necessária.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDemo;