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
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Mind Maps
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of educational content with our AI-powered mind map generator. 
            Click on any module to generate detailed, structured concept maps automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Click Any Module
                  </h3>
                  <p className="text-gray-600">
                    Navigate to the AI Mind Map and click on any Jung psychology module
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    AI Analyzes Content
                  </h3>
                  <p className="text-gray-600">
                    Our AI extracts key concepts, creates hierarchies, and identifies relationships
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 rounded-full p-2 mr-4 mt-1">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Explore Interactive Map
                  </h3>
                  <p className="text-gray-600">
                    Navigate through concepts, see examples, and follow suggested learning paths
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Automatic concept extraction</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Hierarchical organization</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Visual relationship mapping</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Interactive examples</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Suggested learning paths</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Real-time generation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            to="/enhanced-mindmap"
            className="inline-flex items-center bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            Try AI Mind Maps
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <p className="text-gray-600 mt-4">
            Or try the <Link to="/minimap-demo" className="text-primary-600 hover:underline">mini map sectors demo</Link>
          </p>
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Setup Options
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                🤖 Full AI Mode (Recommended)
              </h4>
              <p className="text-gray-600 mb-4">
                Get the complete AI experience with advanced concept analysis and custom structures.
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700">
                REACT_APP_OPENAI_API_KEY=your-key<br/>
                REACT_APP_OPENAI_MODEL=gpt-4
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                📝 Demo Mode
              </h4>
              <p className="text-gray-600 mb-4">
                Experience the feature with pre-structured content. No API key required.
              </p>
              <div className="bg-green-50 rounded p-3 text-sm text-green-700">
                Ready to use! No setup needed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDemo;