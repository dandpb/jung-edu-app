# Mini Map Sectors Feature

## Overview

The Jung Education platform now includes an enhanced mini map with visual sectors that group and categorize educational modules. This feature provides a better overview of the learning content and helps users navigate between related topics.

## Features

### 1. Module Sectors
- Visual sectors in the mini map that group modules by category
- Each sector is rendered as a semi-transparent rectangle with a border
- Sectors automatically calculate their bounds based on contained nodes

### 2. Category-Based Coloring
- Nodes in the mini map are colored according to their module category
- Consistent color scheme between main view and mini map
- Visual grouping makes it easy to identify related content

### 3. Difficulty Indicators
- Small colored circles indicate module difficulty:
  - 🟢 Green: Beginner
  - 🟡 Yellow: Intermediate
  - 🔴 Red: Advanced

### 4. Interactive Navigation
- Click on any sector in the mini map to highlight those modules
- Highlighted modules appear with full opacity while others fade
- Easy navigation between different content categories

### 5. Comprehensive Legend
- Shows all module categories with their colors
- Displays difficulty level indicators
- Positioned for easy reference without obstructing the view

## Module Categories

The current implementation includes these categories:
- **Foundations**: Introductory content about Jung and his work
- **Core Concepts**: Fundamental theories like the collective unconscious
- **Archetypes**: Study of universal patterns and symbols
- **Personal Development**: Individuation and personal growth
- **Personality Theory**: Psychological types and functions
- **Dream Analysis**: Dream interpretation and symbolism

## Implementation Details

### Components

1. **MiniMapSector** (`src/components/MiniMapSector.tsx`)
   - Main component for rendering sectors
   - Handles sector visualization and interaction
   - Includes ModuleNode custom node type
   - Provides MiniMapLegend component

2. **InteractiveMindMap** (enhanced)
   - Calculates module sectors from nodes
   - Integrates MiniMapSector overlay
   - Handles sector click interactions
   - Manages category definitions

3. **MindMapGenerator** (enhanced)
   - Uses custom 'module' node type for module nodes
   - Includes module metadata in node data
   - Enhanced categorization logic

### Data Model Updates

- Added `category` field to Module interface
- Extended MindMapNode data type with module metadata
- Added TypeScript support for spread operators with Sets

## Usage

To see the mini map sectors in action:

1. Navigate to `/minimap-demo` for a dedicated demo page
2. Or go to `/mindmap` to see it in the main mind map view
3. Look for the mini map in the bottom-left corner
4. Click on sectors to highlight specific module groups

## Future Enhancements

Potential improvements for the feature:
- Animated transitions when highlighting sectors
- Customizable sector colors
- Filtering by multiple categories
- Sector statistics (e.g., completion percentage)
- Export sector view as image
- Dynamic sector positioning based on node layout