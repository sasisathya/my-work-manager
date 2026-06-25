'use client';

import React from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';

export default function LayersPanel() {
  const {
    elements,
    selectedElementId,
    selectElement,
    updateElement,
    deleteElement,
    bringToFront,
    sendToBack,
  } = useCanvasStore();

  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleToggleVisibility = (id: string, visible?: boolean) => {
    updateElement(id, { visible: visible === undefined ? false : !visible });
  };

  const handleToggleLock = (id: string, locked?: boolean) => {
    updateElement(id, { locked: locked === undefined ? false : !locked });
  };

  const getElementLabel = (element: any) => {
    const typeLabel = element.type.charAt(0).toUpperCase() + element.type.slice(1);
    if (element.content) {
      return `${typeLabel}: ${element.content.substring(0, 20)}`;
    }
    return typeLabel;
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">Layers</h3>
          <span className="ml-auto text-xs text-gray-400">{elements.length}</span>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No elements yet. Add some from the library!
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sortedElements.map((element) => (
              <div
                key={element.id}
                onClick={() => selectElement(element.id)}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  selectedElementId === element.id
                    ? 'bg-blue-600 bg-opacity-40'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Element type icon */}
                  <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {element.type.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Element label */}
                  <span className="flex-1 text-sm text-white truncate">
                    {getElementLabel(element)}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(element.id, element.visible);
                    }}
                    className="p-1 rounded hover:bg-gray-600 transition-colors"
                    title={element.visible === false ? 'Show' : 'Hide'}
                  >
                    {element.visible === false ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Lock toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLock(element.id, element.locked);
                    }}
                    className="p-1 rounded hover:bg-gray-600 transition-colors"
                    title={element.locked ? 'Unlock' : 'Lock'}
                  >
                    {element.locked ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(element.id);
                    }}
                    className="p-1 rounded hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Z-index controls */}
                {selectedElementId === element.id && (
                  <div className="flex gap-1 mt-2 ml-8">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendToBack(element.id);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                      title="Send to Back"
                    >
                      <ChevronDown className="w-3 h-3 inline mr-1" />
                      Back
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        bringToFront(element.id);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                      title="Bring to Front"
                    >
                      <ChevronUp className="w-3 h-3 inline mr-1" />
                      Front
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
