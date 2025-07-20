import React from 'react';
import InteractiveMindMap from '../components/mindmap/InteractiveMindMap';
import { modules } from '../data/modules';
import { LayoutType } from '../services/mindmap/mindMapLayouts';

/**
 * Demo page to showcase the new mini map sectors feature
 */
const MiniMapDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Demonstração de Setores do Minimapa - Educação Jung
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">O Que Há de Novo?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Setores de Módulos:</strong> O minimapa agora exibe setores visuais que agrupam módulos relacionados por categoria
            </li>
            <li>
              <strong>Cores por Categoria:</strong> Cada categoria de módulo tem sua própria cor no minimapa para fácil identificação
            </li>
            <li>
              <strong>Indicadores de Dificuldade:</strong> Pequenos círculos coloridos mostram o nível de dificuldade dos módulos
            </li>
            <li>
              <strong>Setores Interativos:</strong> Clique em um setor no minimapa para destacar todos os módulos daquela categoria
            </li>
            <li>
              <strong>Legenda:</strong> Uma legenda abrangente mostra todas as categorias e níveis de dificuldade
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '600px' }}>
          <InteractiveMindMap
            modules={modules}
            showMiniMap={true}
            showControls={true}
            initialLayout={LayoutType.HIERARCHICAL}
          />
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Como Usar o Minimapa Aprimorado
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Observe o minimapa no canto inferior esquerdo</li>
            <li>Note os setores coloridos representando diferentes categorias de módulos</li>
            <li>Clique em qualquer setor para destacar esses módulos na visão principal</li>
            <li>Use a legenda para entender as cores das categorias e níveis de dificuldade</li>
            <li>Navegue pelo mapa mental normalmente - o minimapa atualiza em tempo real</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MiniMapDemo;