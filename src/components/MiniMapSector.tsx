import React from 'react';
import { Handle, Position } from 'reactflow';

interface ModuleSector {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  nodeCount: number;
}

interface MiniMapSectorProps {
  sectors: ModuleSector[];
  viewBox: { x: number; y: number; width: number; height: number };
  onSectorClick?: (sectorId: string) => void;
}

export const MiniMapSector: React.FC<MiniMapSectorProps> = ({
  sectors,
  viewBox,
  onSectorClick,
}) => {
  const scaleX = 200 / viewBox.width;
  const scaleY = 150 / viewBox.height;

  return (
    <svg
      className="minimap-sectors"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      viewBox="0 0 200 150"
    >
      {sectors.map((sector) => {
        const scaledX = (sector.bounds.x - viewBox.x) * scaleX;
        const scaledY = (sector.bounds.y - viewBox.y) * scaleY;
        const scaledWidth = sector.bounds.width * scaleX;
        const scaledHeight = sector.bounds.height * scaleY;

        return (
          <g key={sector.id}>
            {/* Sector background */}
            <rect
              x={scaledX}
              y={scaledY}
              width={scaledWidth}
              height={scaledHeight}
              fill={sector.color}
              fillOpacity={0.1}
              stroke={sector.color}
              strokeWidth={1}
              strokeOpacity={0.3}
              rx={4}
              ry={4}
              style={{ 
                pointerEvents: onSectorClick ? 'auto' : 'none',
                cursor: onSectorClick ? 'pointer' : 'default'
              }}
              onClick={() => onSectorClick?.(sector.id)}
            />
            
            {/* Sector label */}
            <text
              x={scaledX + scaledWidth / 2}
              y={scaledY + 10}
              textAnchor="middle"
              fontSize="8"
              fill={sector.color}
              fillOpacity={0.8}
              fontWeight="bold"
            >
              {sector.category}
            </text>
            
            {/* Difficulty indicator */}
            <circle
              cx={scaledX + scaledWidth - 5}
              cy={scaledY + 5}
              r={3}
              fill={getDifficultyColor(sector.difficulty)}
              fillOpacity={0.7}
            />
            
            {/* Node count */}
            <text
              x={scaledX + 5}
              y={scaledY + scaledHeight - 5}
              textAnchor="start"
              fontSize="6"
              fill={sector.color}
              fillOpacity={0.6}
            >
              {sector.nodeCount} nodes
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner':
      return '#4ade80'; // green
    case 'intermediate':
      return '#fbbf24'; // yellow
    case 'advanced':
      return '#f87171'; // red
    default:
      return '#9ca3af'; // gray
  }
};

// Custom node type that includes module metadata
export const ModuleNode: React.FC<{ data: any }> = ({ data }) => {
  const bgColor = data.style?.background || '#fff';
  const borderColor = data.style?.border || '#ccc';
  
  return (
    <div
      className="module-node"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Module category badge */}
      {data.moduleCategory && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: data.categoryColor || '#6b7280',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 'bold',
          }}
        >
          {data.moduleCategory}
        </div>
      )}
      
      {/* Node label */}
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {data.label}
      </div>
      
      {/* Module info */}
      {data.moduleInfo && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {data.moduleInfo}
        </div>
      )}
      
      {/* Difficulty indicator */}
      {data.difficulty && (
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getDifficultyColor(data.difficulty),
          }}
        />
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Legend component for the mini map
export const MiniMapLegend: React.FC<{
  categories: Array<{ name: string; color: string }>;
  difficulties: Array<{ name: string; color: string }>;
}> = ({ categories, difficulties }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px',
        fontSize: '11px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        Module Categories
      </div>
      {categories.map((cat) => (
        <div
          key={cat.name}
          style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              background: cat.color,
              opacity: 0.3,
              border: `1px solid ${cat.color}`,
              borderRadius: '2px',
              marginRight: '4px',
            }}
          />
          <span>{cat.name}</span>
        </div>
      ))}
      
      <div style={{ fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}>
        Difficulty
      </div>
      {difficulties.map((diff) => (
        <div
          key={diff.name}
          style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              background: diff.color,
              borderRadius: '50%',
              marginRight: '4px',
            }}
          />
          <span>{diff.name}</span>
        </div>
      ))}
    </div>
  );
};