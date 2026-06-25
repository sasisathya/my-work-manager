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
          <h3 className="font-semibold text-white">Elements</h3>
        </div>
        <p className="text-xs text-gray-400">Click icons to add</p>
      </div>

      {/* Element Icons Grid - Compact */}
      <div className="p-4">
        <div className="bg-gray-700 rounded-lg p-4 grid grid-cols-5 gap-3">
          {ELEMENTS.map((element) => {
            const Icon = element.icon;
            return (
              <button
                key={element.type}
                onClick={() => handleAddElement(element.type)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-600 hover:bg-blue-600 transition-all duration-200 group"
                title={element.description}
              >
                <Icon className="w-6 h-6 text-blue-300 group-hover:text-white group-hover:scale-125 transition-all" />
                <span className="text-xs text-gray-300 group-hover:text-white mt-1.5 text-center font-semibold">
                  {element.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Info section */}
      <div className="border-t border-gray-700 p-4 text-xs text-gray-400">
        <p className="mb-2 font-semibold text-gray-300">Quick Tips:</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Click icon to add shape</li>
          <li>Drag on canvas to move</li>
          <li>Edit in properties panel</li>
        </ul>
      </div>
    </div>
  );
}
