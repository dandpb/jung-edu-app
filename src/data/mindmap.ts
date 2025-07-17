import { MindMapNode, MindMapEdge } from '../types';

export const defaultMindMapNodes: MindMapNode[] = [
  {
    id: 'jung-center',
    data: { label: "Jung's Analytical Psychology" },
    position: { x: 400, y: 300 },
    style: {
      background: '#4c51ea',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '20px',
      borderRadius: '8px',
      border: 'none',
    },
  },
  {
    id: 'conscious',
    data: { label: 'Conscious Mind' },
    position: { x: 100, y: 100 },
    style: {
      background: '#fef3f2',
      color: '#801f23',
      border: '2px solid #de2c2c',
      borderRadius: '8px',
      padding: '12px',
    },
  },
  {
    id: 'personal-unconscious',
    data: { label: 'Personal Unconscious' },
    position: { x: 700, y: 100 },
    style: {
      background: '#f0f4ff',
      color: '#2f2b89',
      border: '2px solid #6172f3',
      borderRadius: '8px',
      padding: '12px',
    },
  },
  {
    id: 'collective-unconscious',
    data: { label: 'Collective Unconscious' },
    position: { x: 400, y: 500 },
    style: {
      background: '#f0f4ff',
      color: '#2f2b89',
      border: '2px solid #6172f3',
      borderRadius: '8px',
      padding: '12px',
    },
  },
  {
    id: 'intro-jung',
    data: { 
      label: 'Introduction to Carl Jung',
      moduleId: 'intro-jung',
    },
    position: { x: 200, y: 200 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  },
  {
    id: 'collective-unconscious-module',
    data: { 
      label: 'The Collective Unconscious',
      moduleId: 'collective-unconscious',
    },
    position: { x: 450, y: 200 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  },
  {
    id: 'archetypes',
    data: { 
      label: 'Major Archetypes',
      moduleId: 'archetypes',
    },
    position: { x: 700, y: 200 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  },
  {
    id: 'individuation',
    data: { 
      label: 'The Individuation Process',
      moduleId: 'individuation',
    },
    position: { x: 200, y: 350 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  },
  {
    id: 'psychological-types',
    data: { 
      label: 'Psychological Types',
      moduleId: 'psychological-types',
    },
    position: { x: 450, y: 350 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  },
  {
    id: 'dreams-symbols',
    data: { 
      label: 'Dreams and Symbolism',
      moduleId: 'dreams-symbols',
    },
    position: { x: 700, y: 350 },
    style: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
    },
  }
];

export const defaultMindMapEdges: MindMapEdge[] = [
  { id: 'e1', source: 'jung-center', target: 'conscious', animated: true },
  { id: 'e2', source: 'jung-center', target: 'personal-unconscious', animated: true },
  { id: 'e3', source: 'jung-center', target: 'collective-unconscious', animated: true },
  { id: 'e4', source: 'collective-unconscious', target: 'collective-unconscious-module', label: 'Explores' },
  { id: 'e5', source: 'personal-unconscious', target: 'intro-jung' },
  { id: 'e6', source: 'collective-unconscious', target: 'archetypes' },
  { id: 'e7', source: 'jung-center', target: 'psychological-types' },
  { id: 'e8', source: 'archetypes', target: 'individuation' },
  { id: 'e9', source: 'collective-unconscious', target: 'dreams-symbols' },
];