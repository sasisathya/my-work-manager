/**
 * Canvas element types and interfaces
 */

export type ElementType = 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'group';

export interface ElementPosition {
  x: number;
  y: number;
}

export interface ElementSize {
  width: number;
  height: number;
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700';
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  position: ElementPosition;
  size: ElementSize;
  style: ElementStyle;
  content?: string; // For text elements
  imageSrc?: string; // For image elements
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  parent?: string; // For grouped elements
}

export interface CanvasProject {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  elements: CanvasElement[];
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  // Project data
  project: CanvasProject | null;
  elements: CanvasElement[];

  // UI state
  selectedElementId: string | null;
  hoveredElementId: string | null;
  isDragging: boolean;

  // History
  history: CanvasElement[][];
  historyIndex: number;

  // Actions
  setProject: (project: CanvasProject) => void;
  newProject: (name: string, width: number, height: number) => void;

  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;

  // Selection
  selectElement: (id: string | null) => void;

  // Z-index operations
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  increaseZIndex: (id: string) => void;
  decreaseZIndex: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  addToHistory: (elements: CanvasElement[]) => void;
}
