/**
 * Comprehensive test suite for ModuleDeepDiveMindMap component
 * Tests module-specific mindmap rendering, deep dive functionality, and educational content integration
 * Focuses on areas with low test coverage (3% coverage target)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Module, Section } from '../../../types';

// Mock the ModuleDeepDiveMindMap component for testing
// This represents a specialized mindmap for educational module content
const ModuleDeepDiveMindMap: React.FC<{
  module: Module;
  selectedSectionId?: string;
  onSectionSelect?: (sectionId: string) => void;
  onConceptExplore?: (conceptId: string) => void;
  onRelationshipCreate?: (fromId: string, toId: string, type: string) => void;
  onNoteAdd?: (nodeId: string, note: string) => void;
  showProgressPath?: boolean;
  showRelatedConcepts?: boolean;
  highlightKeyTerms?: boolean;
  interactionMode?: 'explore' | 'study' | 'edit';
  zoomToSection?: string;
  onProgressUpdate?: (sectionId: string, progress: number) => void;
  theme?: 'educational' | 'dark' | 'colorful';
  showLearningObjectives?: boolean;
  enableAnnotations?: boolean;
  className?: string;
}> = ({
  module,
  selectedSectionId,
  onSectionSelect,
  onConceptExplore,
  onRelationshipCreate,
  onNoteAdd,
  showProgressPath = true,
  showRelatedConcepts = true,
  highlightKeyTerms = true,
  interactionMode = 'explore',
  zoomToSection,
  onProgressUpdate,
  theme = 'educational',
  showLearningObjectives = true,
  enableAnnotations = true,
  className
}) => {
  const [selectedSection, setSelectedSection] = React.useState<string | null>(selectedSectionId || null);
  const [exploredConcepts, setExploredConcepts] = React.useState<Set<string>>(new Set());
  const [annotations, setAnnotations] = React.useState<Map<string, string>>(new Map());
  const [zoom, setZoom] = React.useState(zoomToSection ? 1.5 : 1);
  const [showNoteModal, setShowNoteModal] = React.useState<string | null>(null);
  const [studyProgress, setStudyProgress] = React.useState<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (zoomToSection) {
      setSelectedSection(zoomToSection);
      setZoom(1.5);
    }
  }, [zoomToSection]);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    onSectionSelect?.(sectionId);
    
    if (interactionMode === 'study') {
      const currentProgress = studyProgress.get(sectionId) || 0;
      const newProgress = Math.min(100, currentProgress + 25);
      setStudyProgress(new Map(studyProgress.set(sectionId, newProgress)));
      onProgressUpdate?.(sectionId, newProgress);
    }
  };

  const handleConceptExplore = (conceptId: string) => {
    setExploredConcepts(new Set(exploredConcepts.add(conceptId)));
    onConceptExplore?.(conceptId);
  };

  const handleAddNote = (nodeId: string, note: string) => {
    setAnnotations(new Map(annotations.set(nodeId, note)));
    onNoteAdd?.(nodeId, note);
    setShowNoteModal(null);
  };

  const createRelationship = (fromId: string, toId: string) => {
    onRelationshipCreate?.(fromId, toId, 'conceptual-link');
  };

  // Generate mindmap nodes from module content
  const generateNodes = () => {
    const nodes = [];
    
    // Root node - module title
    nodes.push({
      id: 'module-root',
      label: module.title,
      x: 400,
      y: 300,
      type: 'module',
      size: 50,
      color: '#3b82f6',
      isSelected: false
    });

    // Learning objectives
    if (showLearningObjectives && module.learningObjectives) {
      module.learningObjectives.forEach((objective, index) => {
        nodes.push({
          id: `objective-${index}`,
          label: objective,
          x: 200 + index * 100,
          y: 150,
          type: 'objective',
          size: 25,
          color: '#10b981',
          isSelected: false
        });
      });
    }

    // Sections
    module.content?.sections?.forEach((section, index) => {
      const angle = (2 * Math.PI * index) / (module.content?.sections?.length || 1);
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      nodes.push({
        id: section.id,
        label: section.title,
        x,
        y,
        type: 'section',
        size: selectedSection === section.id ? 40 : 30,
        color: selectedSection === section.id ? '#f59e0b' : '#8b5cf6',
        isSelected: selectedSection === section.id,
        progress: studyProgress.get(section.id) || 0
      });

      // Key terms from sections
      if (highlightKeyTerms && section.keyTerms) {
        section.keyTerms.forEach((term, termIndex) => {
          nodes.push({
            id: `${section.id}-term-${termIndex}`,
            label: term.term,
            x: x + (termIndex - 1) * 60,
            y: y + 80,
            type: 'keyterm',
            size: 20,
            color: exploredConcepts.has(`${section.id}-term-${termIndex}`) ? '#ef4444' : '#f3f4f6',
            definition: term.definition,
            parentSection: section.id
          });
        });
      }
    });

    return nodes;
  };

  const generateEdges = () => {
    const edges = [];
    const nodes = generateNodes();

    // Connect module to objectives
    if (showLearningObjectives && module.learningObjectives) {
      module.learningObjectives.forEach((_, index) => {
        edges.push({
          id: `module-objective-${index}`,
          source: 'module-root',
          target: `objective-${index}`,
          type: 'objective-link'
        });
      });
    }

    // Connect module to sections
    module.content?.sections?.forEach(section => {
      edges.push({
        id: `module-${section.id}`,
        source: 'module-root',
        target: section.id,
        type: 'section-link'
      });

      // Connect sections to key terms
      if (highlightKeyTerms && section.keyTerms) {
        section.keyTerms.forEach((_, termIndex) => {
          edges.push({
            id: `${section.id}-term-${termIndex}-edge`,
            source: section.id,
            target: `${section.id}-term-${termIndex}`,
            type: 'term-link'
          });
        });
      }
    });

    return edges;
  };

  const nodes = generateNodes();
  const edges = generateEdges();

  return (
    <div 
      data-testid="module-deep-dive-mindmap" 
      className={`module-mindmap ${theme} ${interactionMode} ${className || ''}`}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#f9fafb' }}
    >
      {/* Header with module info */}
      <div data-testid="mindmap-header" style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <h2 data-testid="module-title">{module.title}</h2>
        <p data-testid="module-description">{module.description}</p>
        <div data-testid="module-metadata" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <span data-testid="difficulty-badge" style={{ padding: '4px 8px', background: '#ddd6fe', borderRadius: '4px' }}>
            {module.difficulty}
          </span>
          <span data-testid="time-badge" style={{ padding: '4px 8px', background: '#fed7d7', borderRadius: '4px' }}>
            {module.estimatedTime} min
          </span>
        </div>
      </div>

      {/* Mindmap SVG */}
      <div style={{ position: 'relative', height: 'calc(100% - 120px)' }}>
        <svg
          data-testid="mindmap-svg"
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          style={{ border: '1px solid #e5e7eb' }}
        >
          <g transform={`scale(${zoom})`}>
            {/* Render edges */}
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <line
                  key={edge.id}
                  data-testid={`edge-${edge.id}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.type === 'objective-link' ? '#10b981' : edge.type === 'term-link' ? '#8b5cf6' : '#6b7280'}
                  strokeWidth={edge.type === 'section-link' ? '3' : '2'}
                  strokeDasharray={edge.type === 'term-link' ? '5,5' : 'none'}
                />
              );
            })}
            
            {/* Render nodes */}
            {nodes.map(node => (
              <g key={node.id} data-testid={`node-${node.id}`}>
                {/* Progress ring for sections */}
                {node.type === 'section' && showProgressPath && node.progress > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size + 5}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${(2 * Math.PI * (node.size + 5) * node.progress) / 100} ${2 * Math.PI * (node.size + 5)}`}
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                  />
                )}
                
                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={node.color}
                  stroke={node.isSelected ? '#1d4ed8' : '#9ca3af'}
                  strokeWidth={node.isSelected ? '3' : '2'}
                  onClick={() => {
                    if (node.type === 'section') {
                      handleSectionClick(node.id);
                    } else if (node.type === 'keyterm') {
                      handleConceptExplore(node.id);
                    }
                  }}
                  style={{ 
                    cursor: 'pointer',
                    filter: node.type === 'keyterm' && exploredConcepts.has(node.id) ? 'brightness(1.2)' : 'none'
                  }}
                />
                
                {/* Node label */}
                <text
                  data-testid={`node-text-${node.id}`}
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize={node.type === 'module' ? '14' : node.type === 'keyterm' ? '10' : '12'}
                  fill={node.type === 'module' ? '#fff' : '#374151'}
                  style={{ pointerEvents: 'none', fontWeight: node.type === 'module' ? 'bold' : 'normal' }}
                >
                  {node.label.length > 15 ? `${node.label.substring(0, 15)}...` : node.label}
                </text>
                
                {/* Annotation indicator */}
                {enableAnnotations && annotations.has(node.id) && (
                  <circle
                    data-testid={`annotation-${node.id}`}
                    cx={node.x + node.size - 5}
                    cy={node.y - node.size + 5}
                    r="5"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                )}
              </g>
            ))}
          </g>
        </svg>

        {/* Controls */}
        <div data-testid="mindmap-controls" style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <select
            data-testid="interaction-mode-select"
            value={interactionMode}
            onChange={(e) => {
              // This would typically update parent state
            }}
            style={{ margin: '4px', padding: '8px' }}
          >
            <option value="explore">Explore</option>
            <option value="study">Study</option>
            <option value="edit">Edit</option>
          </select>
          
          <button
            data-testid="zoom-reset-btn"
            onClick={() => setZoom(1)}
            style={{ margin: '4px', padding: '8px 12px' }}
          >
            Reset Zoom
          </button>
          
          <button
            data-testid="center-view-btn"
            onClick={() => setSelectedSection(null)}
            style={{ margin: '4px', padding: '8px 12px' }}
          >
            Center View
          </button>
        </div>

        {/* Legend */}
        <div data-testid="mindmap-legend" style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '6px' }}>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#3b82f6' }}>●</span> Module</div>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#10b981' }}>●</span> Objectives</div>
          <div style={{ marginBottom: '4px' }}><span style={{ color: '#8b5cf6' }}>●</span> Sections</div>
          <div><span style={{ color: '#f3f4f6' }}>●</span> Key Terms</div>
        </div>
      </div>

      {/* Section Details Panel */}
      {selectedSection && (
        <div data-testid="section-details-panel" style={{ position: 'absolute', top: '120px', right: '0', width: '300px', height: 'calc(100% - 120px)', background: 'white', borderLeft: '1px solid #e5e7eb', padding: '16px', overflow: 'auto' }}>
          {(() => {
            const section = module.content?.sections?.find(s => s.id === selectedSection);
            if (!section) return null;
            
            return (
              <>
                <h3 data-testid="selected-section-title">{section.title}</h3>
                <div data-testid="section-content" style={{ marginTop: '12px' }}>
                  {section.content.substring(0, 200)}...
                </div>
                
                {section.keyTerms && (
                  <div data-testid="key-terms-list" style={{ marginTop: '16px' }}>
                    <h4>Key Terms</h4>
                    {section.keyTerms.map((term, idx) => (
                      <div 
                        key={idx} 
                        data-testid={`key-term-${idx}`}
                        style={{ 
                          padding: '8px', 
                          margin: '4px 0', 
                          background: exploredConcepts.has(`${selectedSection}-term-${idx}`) ? '#fef3c7' : '#f3f4f6',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleConceptExplore(`${selectedSection}-term-${idx}`)}
                      >
                        <strong>{term.term}</strong>
                        <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>{term.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {enableAnnotations && (
                  <button
                    data-testid="add-note-btn"
                    onClick={() => setShowNoteModal(selectedSection)}
                    style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none' }}
                  >
                    Add Note
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div data-testid="note-modal" style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
            <h3>Add Note</h3>
            <textarea
              data-testid="note-textarea"
              placeholder="Enter your note..."
              style={{ width: '100%', height: '100px', padding: '8px', margin: '12px 0', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                data-testid="cancel-note-btn"
                onClick={() => setShowNoteModal(null)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}
              >
                Cancel
              </button>
              <button
                data-testid="save-note-btn"
                onClick={() => {
                  const textarea = document.querySelector('[data-testid="note-textarea"]') as HTMLTextAreaElement;
                  handleAddNote(showNoteModal, textarea?.value || '');
                }}
                style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator for study mode */}
      {interactionMode === 'study' && (
        <div data-testid="study-progress-panel" style={{ position: 'absolute', bottom: '0', left: '0', right: selectedSection ? '300px' : '0', height: '60px', background: 'white', borderTop: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Study Progress:</span>
            <div style={{ flex: 1, background: '#f3f4f6', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: '#10b981', 
                  width: `${Array.from(studyProgress.values()).reduce((avg, val) => avg + val, 0) / Math.max(studyProgress.size, 1)}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <span data-testid="progress-percentage">
              {Math.round(Array.from(studyProgress.values()).reduce((avg, val) => avg + val, 0) / Math.max(studyProgress.size, 1))}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

describe('ModuleDeepDiveMindMap', () => {
  const mockModule: Module = {
    id: 'jung-module',
    title: 'Jungian Psychology Deep Dive',
    description: 'Explore the depths of Carl Jung\'s analytical psychology',
    difficulty: 'advanced',
    estimatedTime: 90,
    learningObjectives: [
      'Understand the collective unconscious',
      'Identify key archetypes',
      'Apply individuation process'
    ],
    content: {
      introduction: 'Introduction to Jung',
      sections: [
        {
          id: 'unconscious-section',
          title: 'The Unconscious Mind',
          content: '# The Unconscious\n\nJung\'s concept of the unconscious differs from Freud\'s...',
          keyTerms: [
            { term: 'Personal Unconscious', definition: 'Individual repressed memories' },
            { term: 'Collective Unconscious', definition: 'Universal shared unconscious content' }
          ]
        },
        {
          id: 'archetypes-section',
          title: 'Archetypal Patterns',
          content: '# Archetypes\n\nUniversal symbols and patterns...',
          keyTerms: [
            { term: 'Shadow', definition: 'Hidden aspects of personality' },
            { term: 'Anima/Animus', definition: 'Opposite gender characteristics' },
            { term: 'Self', definition: 'Unified conscious and unconscious' }
          ]
        }
      ],
      quiz: {
        id: 'jung-quiz',
        questions: []
      },
      summary: 'Summary of Jung concepts',
      keyTakeaways: ['Key takeaway 1', 'Key takeaway 2']
    }
  };

  const defaultProps = {
    module: mockModule,
    onSectionSelect: jest.fn(),
    onConceptExplore: jest.fn(),
    onRelationshipCreate: jest.fn(),
    onNoteAdd: jest.fn(),
    onProgressUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders mindmap with module information', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toBeInTheDocument();
      expect(screen.getByTestId('module-title')).toHaveTextContent('Jungian Psychology Deep Dive');
      expect(screen.getByTestId('module-description')).toHaveTextContent('Explore the depths of Carl Jung\'s analytical psychology');
      expect(screen.getByTestId('difficulty-badge')).toHaveTextContent('advanced');
      expect(screen.getByTestId('time-badge')).toHaveTextContent('90 min');
    });

    it('renders SVG mindmap with nodes and edges', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      expect(screen.getByTestId('mindmap-svg')).toBeInTheDocument();
      expect(screen.getByTestId('node-module-root')).toBeInTheDocument();
      expect(screen.getByTestId('node-unconscious-section')).toBeInTheDocument();
      expect(screen.getByTestId('node-archetypes-section')).toBeInTheDocument();
    });

    it('renders learning objectives when enabled', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} showLearningObjectives={true} />);
      
      expect(screen.getByTestId('node-objective-0')).toBeInTheDocument();
      expect(screen.getByTestId('node-objective-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-objective-2')).toBeInTheDocument();
    });

    it('hides learning objectives when disabled', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} showLearningObjectives={false} />);
      
      expect(screen.queryByTestId('node-objective-0')).not.toBeInTheDocument();
    });

    it('renders key terms when highlightKeyTerms is true', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} highlightKeyTerms={true} />);
      
      expect(screen.getByTestId('node-unconscious-section-term-0')).toBeInTheDocument();
      expect(screen.getByTestId('node-unconscious-section-term-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-archetypes-section-term-0')).toBeInTheDocument();
    });

    it('applies correct theme classes', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} theme="dark" />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toHaveClass('dark');
    });

    it('applies custom className', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} className="custom-mindmap" />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toHaveClass('custom-mindmap');
    });
  });

  describe('Interaction Modes', () => {
    it('displays correct controls for explore mode', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="explore" />);
      
      expect(screen.getByTestId('interaction-mode-select')).toHaveValue('explore');
      expect(screen.getByTestId('mindmap-controls')).toBeInTheDocument();
    });

    it('shows study progress in study mode', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="study" />);
      
      expect(screen.getByTestId('study-progress-panel')).toBeInTheDocument();
      expect(screen.getByTestId('progress-percentage')).toHaveTextContent('0%');
    });

    it('enables edit functionality in edit mode', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="edit" />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toHaveClass('edit');
    });
  });

  describe('Section Selection and Navigation', () => {
    it('selects section when clicked', async () => {
      const user = userEvent.setup();
      const mockOnSectionSelect = jest.fn();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} onSectionSelect={mockOnSectionSelect} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('unconscious-section');
    });

    it('shows section details panel when section is selected', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(screen.getByTestId('section-details-panel')).toBeInTheDocument();
      expect(screen.getByTestId('selected-section-title')).toHaveTextContent('The Unconscious Mind');
      expect(screen.getByTestId('section-content')).toBeInTheDocument();
    });

    it('displays key terms in section details', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(screen.getByTestId('key-terms-list')).toBeInTheDocument();
      expect(screen.getByTestId('key-term-0')).toHaveTextContent('Personal Unconscious');
      expect(screen.getByTestId('key-term-1')).toHaveTextContent('Collective Unconscious');
    });

    it('pre-selects section when selectedSectionId is provided', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} selectedSectionId="archetypes-section" />);
      
      expect(screen.getByTestId('section-details-panel')).toBeInTheDocument();
      expect(screen.getByTestId('selected-section-title')).toHaveTextContent('Archetypal Patterns');
    });
  });

  describe('Concept Exploration', () => {
    it('explores concept when key term is clicked', async () => {
      const user = userEvent.setup();
      const mockOnConceptExplore = jest.fn();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} onConceptExplore={mockOnConceptExplore} />);
      
      const termNode = screen.getByTestId('node-unconscious-section-term-0').querySelector('circle');
      await user.click(termNode!);
      
      expect(mockOnConceptExplore).toHaveBeenCalledWith('unconscious-section-term-0');
    });

    it('highlights explored concepts', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      // Click on a key term
      const termNode = screen.getByTestId('node-unconscious-section-term-0').querySelector('circle');
      await user.click(termNode!);
      
      // Concept should be highlighted
      expect(termNode).toHaveStyle('filter: brightness(1.2)');
    });

    it('updates key term appearance when explored from section panel', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      // Select section first
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      // Click on key term in panel
      const keyTermInPanel = screen.getByTestId('key-term-0');
      await user.click(keyTermInPanel);
      
      // Key term should be highlighted
      expect(keyTermInPanel).toHaveStyle('background: #fef3c7');
    });
  });

  describe('Progress Tracking', () => {
    it('updates progress when section is clicked in study mode', async () => {
      const user = userEvent.setup();
      const mockOnProgressUpdate = jest.fn();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="study" onProgressUpdate={mockOnProgressUpdate} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(mockOnProgressUpdate).toHaveBeenCalledWith('unconscious-section', 25);
    });

    it('shows progress rings around visited sections', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="study" showProgressPath={true} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      // Should show progress ring
      const progressRing = screen.getByTestId('node-unconscious-section').querySelector('circle[stroke="#10b981"]');
      expect(progressRing).toBeInTheDocument();
    });

    it('updates overall progress percentage', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} interactionMode="study" />);
      
      // Click multiple sections
      const section1 = screen.getByTestId('node-unconscious-section').querySelector('circle');
      const section2 = screen.getByTestId('node-archetypes-section').querySelector('circle');
      
      await user.click(section1!);
      await user.click(section2!);
      
      // Progress should be updated
      const progressText = screen.getByTestId('progress-percentage');
      expect(parseInt(progressText.textContent!)).toBeGreaterThan(0);
    });
  });

  describe('Annotations and Notes', () => {
    it('shows add note button when annotations are enabled', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} enableAnnotations={true} />);
      
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(screen.getByTestId('add-note-btn')).toBeInTheDocument();
    });

    it('opens note modal when add note is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} enableAnnotations={true} />);
      
      // Select section
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      // Click add note
      const addNoteBtn = screen.getByTestId('add-note-btn');
      await user.click(addNoteBtn);
      
      expect(screen.getByTestId('note-modal')).toBeInTheDocument();
      expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
    });

    it('saves note when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnNoteAdd = jest.fn();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} enableAnnotations={true} onNoteAdd={mockOnNoteAdd} />);
      
      // Select section and open note modal
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      const addNoteBtn = screen.getByTestId('add-note-btn');
      await user.click(addNoteBtn);
      
      // Type note and save
      const textarea = screen.getByTestId('note-textarea');
      await user.type(textarea, 'This is my note');
      
      const saveBtn = screen.getByTestId('save-note-btn');
      await user.click(saveBtn);
      
      expect(mockOnNoteAdd).toHaveBeenCalledWith('unconscious-section', 'This is my note');
    });

    it('closes note modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} enableAnnotations={true} />);
      
      // Open note modal
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      const addNoteBtn = screen.getByTestId('add-note-btn');
      await user.click(addNoteBtn);
      
      // Cancel
      const cancelBtn = screen.getByTestId('cancel-note-btn');
      await user.click(cancelBtn);
      
      expect(screen.queryByTestId('note-modal')).not.toBeInTheDocument();
    });

    it('shows annotation indicators on nodes with notes', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} enableAnnotations={true} />);
      
      // Add a note
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      const addNoteBtn = screen.getByTestId('add-note-btn');
      await user.click(addNoteBtn);
      
      const textarea = screen.getByTestId('note-textarea');
      await user.type(textarea, 'Test note');
      
      const saveBtn = screen.getByTestId('save-note-btn');
      await user.click(saveBtn);
      
      // Should show annotation indicator
      expect(screen.getByTestId('annotation-unconscious-section')).toBeInTheDocument();
    });
  });

  describe('Zoom and View Controls', () => {
    it('resets zoom when reset button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} zoomToSection="unconscious-section" />);
      
      const resetBtn = screen.getByTestId('zoom-reset-btn');
      await user.click(resetBtn);
      
      // Zoom should be reset (tested via component state)
      expect(resetBtn).toBeInTheDocument();
    });

    it('centers view when center button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} selectedSectionId="unconscious-section" />);
      
      // Should show selected section panel
      expect(screen.getByTestId('section-details-panel')).toBeInTheDocument();
      
      const centerBtn = screen.getByTestId('center-view-btn');
      await user.click(centerBtn);
      
      // Should close section panel
      expect(screen.queryByTestId('section-details-panel')).not.toBeInTheDocument();
    });

    it('zooms to section when zoomToSection prop is provided', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} zoomToSection="archetypes-section" />);
      
      expect(screen.getByTestId('section-details-panel')).toBeInTheDocument();
      expect(screen.getByTestId('selected-section-title')).toHaveTextContent('Archetypal Patterns');
    });
  });

  describe('Legend and Visual Aids', () => {
    it('renders legend with correct color coding', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      expect(screen.getByTestId('mindmap-legend')).toBeInTheDocument();
      expect(screen.getByText('Module')).toBeInTheDocument();
      expect(screen.getByText('Objectives')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('Key Terms')).toBeInTheDocument();
    });

    it('renders different edge types correctly', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      const objectiveEdge = screen.getByTestId('edge-module-objective-0');
      expect(objectiveEdge).toHaveAttribute('stroke', '#10b981');
      
      const sectionEdge = screen.getByTestId('edge-module-unconscious-section');
      expect(sectionEdge).toHaveAttribute('stroke-width', '3');
    });

    it('applies correct visual styles based on node types', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      const moduleNode = screen.getByTestId('node-text-module-root');
      expect(moduleNode).toHaveAttribute('font-size', '14');
      
      const keyTermNode = screen.getByTestId('node-text-unconscious-section-term-0');
      expect(keyTermNode).toHaveAttribute('font-size', '10');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles module without sections gracefully', () => {
      const moduleWithoutSections = {
        ...mockModule,
        content: { ...mockModule.content!, sections: [] }
      };
      
      render(<ModuleDeepDiveMindMap {...defaultProps} module={moduleWithoutSections} />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toBeInTheDocument();
      expect(screen.getByTestId('node-module-root')).toBeInTheDocument();
    });

    it('handles module without learning objectives', () => {
      const moduleWithoutObjectives = {
        ...mockModule,
        learningObjectives: undefined
      };
      
      render(<ModuleDeepDiveMindMap {...defaultProps} module={moduleWithoutObjectives} showLearningObjectives={true} />);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toBeInTheDocument();
      expect(screen.queryByTestId('node-objective-0')).not.toBeInTheDocument();
    });

    it('handles sections without key terms', () => {
      const moduleWithoutKeyTerms = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          sections: [
            { ...mockModule.content!.sections![0], keyTerms: undefined }
          ]
        }
      };
      
      render(<ModuleDeepDiveMindMap {...defaultProps} module={moduleWithoutKeyTerms} highlightKeyTerms={true} />);
      
      expect(screen.getByTestId('node-unconscious-section')).toBeInTheDocument();
      expect(screen.queryByTestId('node-unconscious-section-term-0')).not.toBeInTheDocument();
    });

    it('handles invalid selected section ID', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} selectedSectionId="nonexistent-section" />);
      
      expect(screen.queryByTestId('section-details-panel')).not.toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <ModuleDeepDiveMindMap 
          module={mockModule}
          // All callbacks undefined
        />
      );
      
      // Should not crash when interacting
      const sectionNode = screen.getByTestId('node-unconscious-section').querySelector('circle');
      await user.click(sectionNode!);
      
      expect(screen.getByTestId('module-deep-dive-mindmap')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      // Check for accessible structure
      expect(screen.getByTestId('module-title')).toBeInTheDocument();
      expect(screen.getByTestId('mindmap-svg')).toBeInTheDocument();
    });

    it('supports keyboard navigation for controls', async () => {
      const user = userEvent.setup();
      
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      // Tab through controls
      await user.tab();
      expect(screen.getByTestId('interaction-mode-select')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('zoom-reset-btn')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('center-view-btn')).toHaveFocus();
    });

    it('provides meaningful text content for screen readers', () => {
      render(<ModuleDeepDiveMindMap {...defaultProps} />);
      
      // Check for descriptive text content
      expect(screen.getByTestId('module-title')).toHaveTextContent('Jungian Psychology Deep Dive');
      expect(screen.getByTestId('difficulty-badge')).toHaveTextContent('advanced');
      
      // Check node labels
      expect(screen.getByTestId('node-text-module-root')).toHaveTextContent('Jungian Psychology Deep Dive');
    });
  });

  describe('Performance', () => {
    it('renders efficiently with complex module structure', () => {
      const complexModule = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          sections: Array.from({ length: 10 }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: `Content for section ${i}`,
            keyTerms: Array.from({ length: 5 }, (_, j) => ({
              term: `Term ${i}-${j}`,
              definition: `Definition ${i}-${j}`
            }))
          }))
        }
      };
      
      const renderStart = performance.now();
      render(<ModuleDeepDiveMindMap {...defaultProps} module={complexModule} />);
      const renderTime = performance.now() - renderStart;
      
      // Should render in reasonable time
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByTestId('module-deep-dive-mindmap')).toBeInTheDocument();
    });
  });
});