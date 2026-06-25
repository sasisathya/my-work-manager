/**
 * Canvas utility functions
 * Geometry, collision detection, serialization
 */

import { CanvasElement, CanvasProject, ElementType } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Element factory functions
export const createElement = (
  type: ElementType,
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  zIndex: number = 0
): CanvasElement => {
  const baseElement: CanvasElement = {
    id: generateId(),
    type,
    position: { x, y },
    size: { width, height },
    zIndex,
    style: {
      fill: type === 'text' ? 'transparent' : '#3b82f6',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1,
      rotation: 0,
      fontSize: 16,
      fontFamily: 'Arial',
      textAlign: 'left',
      fontWeight: 'normal',
    },
  };

  if (type === 'text') {
    baseElement.content = 'Click to edit text';
    baseElement.style.fill = 'transparent';
  }

  return baseElement;
};

// Geometry calculations
export const getElementBounds = (element: CanvasElement) => {
  const { position, size } = element;
  return {
    x: position.x,
    y: position.y,
    x2: position.x + size.width,
    y2: position.y + size.height,
    width: size.width,
    height: size.height,
  };
};

export const pointInElement = (
  x: number,
  y: number,
  element: CanvasElement
): boolean => {
  const bounds = getElementBounds(element);
  return x >= bounds.x && x <= bounds.x2 && y >= bounds.y && y <= bounds.y2;
};

export const elementIntersects = (
  element1: CanvasElement,
  element2: CanvasElement
): boolean => {
  const bounds1 = getElementBounds(element1);
  const bounds2 = getElementBounds(element2);

  return !(
    bounds1.x2 < bounds2.x ||
    bounds1.x > bounds2.x2 ||
    bounds1.y2 < bounds2.y ||
    bounds1.y > bounds2.y2
  );
};

// Serialization
export const serializeProject = (project: CanvasProject): string => {
  return JSON.stringify(project, null, 2);
};

export const deserializeProject = (json: string): CanvasProject => {
  return JSON.parse(json);
};

// Grid/snap functions
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

// Canvas rendering helpers
export const getElementPath = (element: CanvasElement): string => {
  const { position, size, style } = element;
  const { x, y } = position;
  const { width, height } = size;

  switch (element.type) {
    case 'rectangle':
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;

    case 'circle':
      const radius = Math.min(width, height) / 2;
      return `M ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y + height} A ${radius} ${radius} 0 1 0 ${x + radius} ${y}`;

    case 'line':
      return `M ${x} ${y} L ${x + width} ${y + height}`;

    default:
      return '';
  }
};

// Export helpers
export const canvasToBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    });
  });
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Bounds calculation for multiple elements
export const getSelectionBounds = (elements: CanvasElement[]) => {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x2);
    maxY = Math.max(maxY, bounds.y2);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Alignment helpers
export enum AlignmentType {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
}

export const alignElements = (
  elements: CanvasElement[],
  type: AlignmentType
): CanvasElement[] => {
  if (elements.length === 0) return elements;

  const bounds = getSelectionBounds(elements);
  if (!bounds) return elements;

  return elements.map((element) => {
    const elementBounds = getElementBounds(element);

    switch (type) {
      case AlignmentType.LEFT:
        return {
          ...element,
          position: { ...element.position, x: bounds.x },
        };

      case AlignmentType.CENTER:
        return {
          ...element,
          position: {
            ...element.position,
            x: bounds.x + (bounds.width - elementBounds.width) / 2,
          },
        };

      case AlignmentType.RIGHT:
        return {
          ...element,
          position: {
            ...element.position,
            x: bounds.x + bounds.width - elementBounds.width,
          },
        };

      case AlignmentType.TOP:
        return {
          ...element,
          position: { ...element.position, y: bounds.y },
        };

      case AlignmentType.MIDDLE:
        return {
          ...element,
          position: {
            ...element.position,
            y: bounds.y + (bounds.height - elementBounds.height) / 2,
          },
        };

      case AlignmentType.BOTTOM:
        return {
          ...element,
          position: {
            ...element.position,
            y: bounds.y + bounds.height - elementBounds.height,
          },
        };

      default:
        return element;
    }
  });
};
