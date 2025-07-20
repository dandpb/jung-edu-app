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
          Jung Education Mini Map Sectors Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What's New?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Module Sectors:</strong> The mini map now displays visual sectors that group related modules by category
            </li>
            <li>
              <strong>Category Colors:</strong> Each module category has its own color in the mini map for easy identification
            </li>
            <li>
              <strong>Difficulty Indicators:</strong> Small colored circles show the difficulty level of modules
            </li>
            <li>
              <strong>Interactive Sectors:</strong> Click on a sector in the mini map to highlight all modules in that category
            </li>
            <li>
              <strong>Legend:</strong> A comprehensive legend shows all categories and difficulty levels
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
            How to Use the Enhanced Mini Map
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Look at the mini map in the bottom-left corner</li>
            <li>Notice the colored sectors representing different module categories</li>
            <li>Click on any sector to highlight those modules in the main view</li>
            <li>Use the legend to understand category colors and difficulty levels</li>
            <li>Navigate the mind map as usual - the mini map updates in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MiniMapDemo;