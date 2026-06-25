'use client';

import React from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { createElement } from '@/lib/canvas/utils';
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  ArrowRight,
  Shapes,
} from 'lucide-react';

const ELEMENTS = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    icon: Square,
    description: 'Add a rectangular shape',
  },
  {
    type: 'circle',
    label: 'Circle',
    icon: Circle,
    description: 'Add a circular shape',
  },
  {
    type: 'line',
    label: 'Line',
    icon: ArrowRight,
    description: 'Add a line',
  },
  {
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Add text element',
  },
  {
    type: 'image',
    label: 'Image',
    icon: ImageIcon,
    description: 'Add an image',
  },
];

export default function ElementLibrary() {
  const { addElement, elements } = useCanvasStore();

  const handleAddElement = (elementType: string) => {
    const maxZIndex = elements.length > 0 ? Math.max(...elements.map((el) => el.zIndex)) : 0;

    const newElement = createElement(
      elementType as any,
      100 + Math.random() * 200,
      100 + Math.random() * 200,
      150,
      100,
      maxZIndex + 1
    );

    addElement(newElement);
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <Shapes className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Element Library</h3>
        </div>
        <p className="text-xs text-gray-400">Click to add elements to canvas</p>
      </div>

      {/* Elements Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {ELEMENTS.map((element) => {
          const Icon = element.icon;
          return (
            <button
              key={element.type}
              onClick={() => handleAddElement(element.type)}
              className="w-full flex items-start gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left group"
              title={element.description}
            >
              <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{element.label}</p>
                <p className="text-xs text-gray-400 truncate">{element.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info section */}
      <div className="border-t border-gray-700 p-4 text-xs text-gray-400">
        <p className="mb-2 font-semibold text-gray-300">Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Drag elements on canvas to move</li>
          <li>Click elements to select</li>
          <li>Use Inspector to edit properties</li>
        </ul>
      </div>
    </div>
  );
}
