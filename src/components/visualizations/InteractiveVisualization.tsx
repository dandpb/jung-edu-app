import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InteractiveVisualization as IVisualization, VisualizationType } from '../../types';
import * as d3 from 'd3';
import { 
  Eye, 
  Info, 
  Maximize2, 
  RotateCcw, 
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

interface InteractiveVisualizationProps {
  visualization: IVisualization;
  onInteraction?: (interaction: string, data: any) => void;
  className?: string;
}

const InteractiveVisualization: React.FC<InteractiveVisualizationProps> = ({
  visualization,
  onInteraction,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Responsive dimensions
  const dimensions = useMemo(() => {
    const baseWidth = visualization.config.dimensions.width;
    const baseHeight = visualization.config.dimensions.height;
    const aspectRatio = baseWidth / baseHeight;
    
    if (isFullscreen) {
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 40;
      const containerAspectRatio = maxWidth / maxHeight;
      
      if (containerAspectRatio > aspectRatio) {
        return { width: maxHeight * aspectRatio, height: maxHeight };
      } else {
        return { width: maxWidth, height: maxWidth / aspectRatio };
      }
    }
    
    return { width: Math.min(baseWidth, 800), height: Math.min(baseHeight, 600) };
  }, [visualization.config.dimensions, isFullscreen]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set up SVG dimensions
    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

    // Create visualization based on type
    switch (visualization.type) {
      case 'concept-map':
        renderConceptMap(svg, dimensions);
        break;
      case 'timeline':
        renderTimeline(svg, dimensions);
        break;
      case 'personality-wheel':
        renderPersonalityWheel(svg, dimensions);
        break;
      case 'archetype-mandala':
        renderArchetypeMandala(svg, dimensions);
        break;
      case 'dream-symbols':
        renderDreamSymbols(svg, dimensions);
        break;
      case 'individuation-journey':
        renderIndividuationJourney(svg, dimensions);
        break;
      case '3d-psyche-model':
        render3DPsycheModel(svg, dimensions);
        break;
      default:
        renderDefaultVisualization(svg, dimensions);
    }
  }, [visualization, dimensions, animationSpeed]);

  const renderConceptMap = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const nodes = visualization.data.nodes || [];
    const links = visualization.data.links || [];

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => (d as any).id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dims.width / 2, dims.height / 2));

    // Create links
    const link = svg.selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const node = svg.selectAll('circle')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append('circle')
      .attr('r', (d: any) => d.size || 20)
      .attr('fill', (d: any) => d.color || '#69b3a2')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add interactions
    node
      .on('mouseover', function(event, d: any) {
        d3.select(this).select('circle').attr('r', (d.size || 20) * 1.5);
        showTooltip(event, d);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).select('circle').attr('r', d.size || 20);
        hideTooltip();
      })
      .on('click', function(event, d: any) {
        setSelectedElement(d.id);
        onInteraction?.('node-click', d);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  };

  const renderPersonalityWheel = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const data = visualization.data.functions || [
      { name: 'Thinking', value: 0.8, angle: 0 },
      { name: 'Feeling', value: 0.6, angle: 90 },
      { name: 'Sensation', value: 0.7, angle: 180 },
      { name: 'Intuition', value: 0.9, angle: 270 }
    ];

    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 50;

    // Create circular grid
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    gridLevels.forEach(level => {
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', maxRadius * level)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    });

    // Create axes
    const axes = ['Thinking', 'Feeling', 'Sensation', 'Intuition'];
    axes.forEach((axis, index) => {
      const angle = (index * 90 - 90) * Math.PI / 180;
      const x2 = centerX + Math.cos(angle) * maxRadius;
      const y2 = centerY + Math.sin(angle) * maxRadius;

      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);

      svg.append('text')
        .attr('x', centerX + Math.cos(angle) * (maxRadius + 20))
        .attr('y', centerY + Math.sin(angle) * (maxRadius + 20))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(axis);
    });

    // Create data visualization
    const lineGenerator = d3.line<any>()
      .x((d: any) => {
        const angle = (d.angle - 90) * Math.PI / 180;
        return centerX + Math.cos(angle) * maxRadius * d.value;
      })
      .y((d: any) => {
        const angle = (d.angle - 90) * Math.PI / 180;
        return centerY + Math.sin(angle) * maxRadius * d.value;
      })
      .curve(d3.curveCardinalClosed);

    svg.append('path')
      .datum([...data, data[0]]) // Close the path
      .attr('d', lineGenerator)
      .attr('fill', 'rgba(105, 179, 162, 0.3)')
      .attr('stroke', '#69b3a2')
      .attr('stroke-width', 3);

    // Add data points
    data.forEach((d: any) => {
      const angle = (d.angle - 90) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * maxRadius * d.value;
      const y = centerY + Math.sin(angle) * maxRadius * d.value;

      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', '#69b3a2')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('r', 10);
          showTooltip(event, { name: d.name, value: `${Math.round(d.value * 100)}%` });
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 6);
          hideTooltip();
        });
    });
  };

  const renderArchetypeMandala = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const archetypes = visualization.data.archetypes || [
      { name: 'The Self', color: '#FFD700', size: 40, x: dims.width / 2, y: dims.height / 2 },
      { name: 'Shadow', color: '#696969', size: 30, x: dims.width / 2 - 100, y: dims.height / 2 + 100 },
      { name: 'Anima', color: '#FF69B4', size: 25, x: dims.width / 2 + 100, y: dims.height / 2 - 100 },
      { name: 'Animus', color: '#4169E1', size: 25, x: dims.width / 2 - 100, y: dims.height / 2 - 100 },
      { name: 'Persona', color: '#32CD32', size: 20, x: dims.width / 2 + 100, y: dims.height / 2 + 100 }
    ];

    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;

    // Create mandala circles
    const circles = [0.3, 0.5, 0.7, 0.9];
    circles.forEach((ratio, index) => {
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', outerRadius * ratio)
        .attr('fill', 'none')
        .attr('stroke', `hsl(${index * 60}, 50%, 80%)`)
        .attr('stroke-width', 2)
        .attr('opacity', 0.6);
    });

    // Create archetype nodes
    archetypes.forEach((archetype: any, index: number) => {
      const group = svg.append('g')
        .attr('class', 'archetype')
        .style('cursor', 'pointer');

      group.append('circle')
        .attr('cx', archetype.x)
        .attr('cy', archetype.y)
        .attr('r', archetype.size)
        .attr('fill', archetype.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('opacity', 0.8);

      group.append('text')
        .attr('x', archetype.x)
        .attr('y', archetype.y + archetype.size + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(archetype.name);

      // Add interactions
      group
        .on('mouseover', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', archetype.size * 1.2)
            .attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', archetype.size)
            .attr('opacity', 0.8);
        })
        .on('click', function() {
          setSelectedElement(archetype.name);
          onInteraction?.('archetype-click', archetype);
        });
    });

    // Add connecting lines
    archetypes.forEach((source: any, i: number) => {
      archetypes.slice(i + 1).forEach((target: any) => {
        svg.append('line')
          .attr('x1', source.x)
          .attr('y1', source.y)
          .attr('x2', target.x)
          .attr('y2', target.y)
          .attr('stroke', '#ddd')
          .attr('stroke-width', 1)
          .attr('opacity', 0.3);
      });
    });
  };

  const renderTimeline = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const events = visualization.data.events || [
      { year: 1875, event: 'Jung born', importance: 3 },
      { year: 1906, event: 'Met Freud', importance: 5 },
      { year: 1913, event: 'Break with Freud', importance: 4 },
      { year: 1921, event: 'Published Psychological Types', importance: 5 },
      { year: 1961, event: 'Jung died', importance: 3 }
    ];

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = dims.width - margin.left - margin.right;
    const height = dims.height - margin.top - margin.bottom;

    const extent = d3.extent(events, (d: any) => d.year);
    const xScale = d3.scaleLinear()
      .domain(extent && extent[0] !== undefined ? (extent as unknown as [number, number]) : [0, 1])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([1, 5])
      .range([height, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Add events
    const eventGroups = g.selectAll('.event')
      .data(events)
      .enter().append('g')
      .attr('class', 'event')
      .attr('transform', (d: any) => `translate(${xScale(d.year)}, ${yScale(d.importance)})`);

    eventGroups.append('circle')
      .attr('r', (d: any) => d.importance * 2)
      .attr('fill', '#69b3a2')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    eventGroups.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text((d: any) => d.year);

    eventGroups.append('text')
      .attr('x', 0)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .text((d: any) => d.event);

    // Add interactions
    eventGroups
      .style('cursor', 'pointer')
      .on('mouseover', function(event: any, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.importance * 3);
        showTooltip(event, d);
      })
      .on('mouseout', function(event: any, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.importance * 2);
        hideTooltip();
      });
  };

  const renderDreamSymbols = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const symbols = visualization.data.symbols || [
      { symbol: '🌙', meaning: 'Unconscious', x: 100, y: 100, frequency: 0.8 },
      { symbol: '🐍', meaning: 'Transformation', x: 200, y: 150, frequency: 0.6 },
      { symbol: '🏠', meaning: 'Self/Psyche', x: 300, y: 100, frequency: 0.9 },
      { symbol: '💧', meaning: 'Emotions', x: 150, y: 200, frequency: 0.7 },
      { symbol: '🔥', meaning: 'Passion/Energy', x: 250, y: 200, frequency: 0.5 }
    ];

    symbols.forEach((symbol: any) => {
      const group = svg.append('g')
        .attr('class', 'symbol')
        .style('cursor', 'pointer');

      // Symbol background
      group.append('circle')
        .attr('cx', symbol.x)
        .attr('cy', symbol.y)
        .attr('r', 20 + symbol.frequency * 20)
        .attr('fill', `rgba(105, 179, 162, ${symbol.frequency})`)
        .attr('stroke', '#69b3a2')
        .attr('stroke-width', 2);

      // Symbol text
      group.append('text')
        .attr('x', symbol.x)
        .attr('y', symbol.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '24px')
        .text(symbol.symbol);

      // Meaning label
      group.append('text')
        .attr('x', symbol.x)
        .attr('y', symbol.y + 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(symbol.meaning);

      // Interactions
      group
        .on('mouseover', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', (20 + symbol.frequency * 20) * 1.3);
        })
        .on('mouseout', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', 20 + symbol.frequency * 20);
        })
        .on('click', function() {
          onInteraction?.('symbol-click', symbol);
        });
    });
  };

  const renderIndividuationJourney = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const stages = [
      { name: 'Ego Development', x: 50, y: dims.height - 50, color: '#FF6B6B' },
      { name: 'Encounter with Shadow', x: 200, y: dims.height - 100, color: '#4ECDC4' },
      { name: 'Anima/Animus Integration', x: 350, y: dims.height - 150, color: '#45B7D1' },
      { name: 'Self Realization', x: 500, y: dims.height - 200, color: '#96CEB4' }
    ];

    // Create path
    const lineGenerator = d3.line<any>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(stages)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#69b3a2')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '10,5');

    // Add stages
    stages.forEach((stage, index) => {
      const group = svg.append('g')
        .attr('class', 'stage')
        .style('cursor', 'pointer');

      group.append('circle')
        .attr('cx', stage.x)
        .attr('cy', stage.y)
        .attr('r', 25)
        .attr('fill', stage.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);

      group.append('text')
        .attr('x', stage.x)
        .attr('y', stage.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text(index + 1);

      group.append('text')
        .attr('x', stage.x)
        .attr('y', stage.y - 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(stage.name);

      // Interactions
      group
        .on('mouseover', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', 35);
        })
        .on('mouseout', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', 25);
        })
        .on('click', function() {
          onInteraction?.('stage-click', stage);
        });
    });
  };

  const render3DPsycheModel = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;

    // Conscious level
    svg.append('ellipse')
      .attr('cx', centerX)
      .attr('cy', centerY - 50)
      .attr('rx', 80)
      .attr('ry', 30)
      .attr('fill', 'rgba(255, 235, 59, 0.7)')
      .attr('stroke', '#FBC02D')
      .attr('stroke-width', 2);

    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 50)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .text('Conscious');

    // Personal Unconscious
    svg.append('ellipse')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('rx', 120)
      .attr('ry', 50)
      .attr('fill', 'rgba(156, 39, 176, 0.5)')
      .attr('stroke', '#7B1FA2')
      .attr('stroke-width', 2);

    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text('Personal Unconscious');

    // Collective Unconscious
    svg.append('ellipse')
      .attr('cx', centerX)
      .attr('cy', centerY + 70)
      .attr('rx', 160)
      .attr('ry', 80)
      .attr('fill', 'rgba(63, 81, 181, 0.3)')
      .attr('stroke', '#3F51B5')
      .attr('stroke-width', 2);

    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 70)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('fill', '#3F51B5')
      .text('Collective Unconscious');

    // Add archetypes floating in collective unconscious
    const archetypes = [
      { name: 'Shadow', x: centerX - 80, y: centerY + 100 },
      { name: 'Anima', x: centerX + 80, y: centerY + 100 },
      { name: 'Self', x: centerX, y: centerY + 120 }
    ];

    archetypes.forEach(archetype => {
      const group = svg.append('g')
        .style('cursor', 'pointer');

      group.append('circle')
        .attr('cx', archetype.x)
        .attr('cy', archetype.y)
        .attr('r', 15)
        .attr('fill', '#FF5722')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      group.append('text')
        .attr('x', archetype.x)
        .attr('y', archetype.y + 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .text(archetype.name);

      group.on('click', function() {
        onInteraction?.('archetype-click', archetype);
      });
    });
  };

  const renderDefaultVisualization = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dims: { width: number; height: number }) => {
    svg.append('text')
      .attr('x', dims.width / 2)
      .attr('y', dims.height / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('fill', '#666')
      .text('Visualization not implemented');
  };

  const showTooltip = (event: any, data: any) => {
    // Create tooltip logic here
    console.log('Tooltip:', data);
  };

  const hideTooltip = () => {
    // Hide tooltip logic here
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetVisualization = () => {
    setSelectedElement(null);
    // Reset to initial state
  };

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`interactive-visualization ${className}`} ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900">{visualization.title}</h3>
        
        <div className="flex items-center space-x-2">
          {visualization.config.animations && (
            <button
              onClick={toggleAnimation}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={resetVisualization}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-3">Configurações</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Velocidade da Animação: {animationSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={visualization.config.interactivity}
                  onChange={() => {}}
                  className="mr-2"
                />
                Interatividade
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={visualization.config.animations}
                  onChange={() => {}}
                  className="mr-2"
                />
                Animações
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <p className="text-sm text-blue-800">{visualization.description}</p>
        </div>
      </div>

      {/* Visualization */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-8' : ''}`}>
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <svg
            ref={svgRef}
            className="w-full h-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* Selected Element Info */}
      {selectedElement && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Elemento Selecionado</h4>
          <p className="text-sm text-green-800">
            Você selecionou: <strong>{selectedElement}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveVisualization;