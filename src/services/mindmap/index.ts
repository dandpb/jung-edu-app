export * from './mindMapGenerator';
export * from './mindMapLayouts';
export * from './reactFlowAdapter';

import { MindMapGenerator } from './mindMapGenerator';
import { MindMapLayouts } from './mindMapLayouts';
import { ReactFlowAdapter } from './reactFlowAdapter';

// Default instances
export const mindMapGenerator = new MindMapGenerator();
export const mindMapLayouts = new MindMapLayouts();
export const reactFlowAdapter = new ReactFlowAdapter();