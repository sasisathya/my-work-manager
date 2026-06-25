'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { CanvasElement } from '@/lib/canvas/types';
import { pointInElement } from '@/lib/canvas/utils';
import ElementRenderer from './ElementRenderer';

interface CanvasProps {
  onElementSelect?: (elementId: string | null) => void;
}

export default function Canvas({ onElementSelect }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);

  const {
    project,
    elements,
    selectedElementId,
    selectElement,
    moveElement,
  } = useCanvasStore();

  if (!project) {
    return <div className="flex items-center justify-center h-full">No project loaded</div>;
  }

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an element
    let clickedElement: CanvasElement | undefined;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (pointInElement(x, y, elements[i])) {
        clickedElement = elements[i];
        break;
      }
    }

    if (clickedElement) {
      selectElement(clickedElement.id);
      onElementSelect?.(clickedElement.id);
    } else {
      selectElement(null);
      onElementSelect?.(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<any>, elementId: string) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x, y });
    setIsDraggingElement(true);
    selectElement(elementId);
    onElementSelect?.(elementId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDraggingElement || !dragStart || !selectedElementId) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      const element = elements.find((el) => el.id === selectedElementId);
      if (!element) return;

      const newX = Math.max(0, element.position.x + deltaX);
      const newY = Math.max(0, element.position.y + deltaY);

      moveElement(selectedElementId, newX, newY);
      setDragStart({ x: currentX, y: currentY });
    },
    [isDraggingElement, dragStart, selectedElementId, elements, moveElement]
  );

  const handleMouseUp = () => {
    setIsDraggingElement(false);
    setDragStart(null);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 overflow-auto">
      <div className="bg-gray-700 rounded-lg shadow-2xl" style={{ width: project.width, height: project.height }}>
        <svg
          ref={svgRef}
          width={project.width}
          height={project.height}
          className="w-full h-full cursor-default"
          style={{ backgroundColor: project.backgroundColor }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Render grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Grid */}
          <rect width={project.width} height={project.height} fill="url(#grid)" />

          {/* Render elements sorted by z-index */}
          {[...elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <g
                key={element.id}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                className={selectedElementId === element.id ? 'opacity-100' : ''}
              >
                <ElementRenderer
                  element={element}
                  isSelected={selectedElementId === element.id}
                />
              </g>
            ))}
        </svg>
      </div>
    </div>
  );
}
