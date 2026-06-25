'use client';

import React from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Settings, Copy, Delete } from 'lucide-react';

export default function PropertiesInspector() {
  const { elements, selectedElementId, updateElement, deleteElement } =
    useCanvasStore();

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Select an element to edit
        </div>
      </div>
    );
  }

  const handleUpdateStyle = (property: string, value: any) => {
    updateElement(selectedElement.id, {
      style: {
        ...selectedElement.style,
        [property]: value,
      },
    });
  };

  const handleUpdateProperty = (property: string, value: any) => {
    updateElement(selectedElement.id, {
      [property]: value,
    });
  };

  const handleDuplicate = () => {
    // TODO: Implement duplication
  };

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Properties</h3>
          </div>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
            {selectedElement.type}
          </span>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position Section */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Position
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position.x)}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      position: {
                        x: parseFloat(e.target.value),
                        y: selectedElement.position.y,
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position.y)}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      position: {
                        x: selectedElement.position.x,
                        y: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Size Section */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Size
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.size.width)}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      size: {
                        width: parseFloat(e.target.value),
                        height: selectedElement.size.height,
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.size.height)}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      size: {
                        width: selectedElement.size.width,
                        height: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fill Color */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Fill Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedElement.style.fill || '#3b82f6'}
              onChange={(e) => handleUpdateStyle('fill', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border border-gray-600"
            />
            <input
              type="text"
              value={selectedElement.style.fill || '#3b82f6'}
              onChange={(e) => handleUpdateStyle('fill', e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono text-xs"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Stroke Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedElement.style.stroke || '#000000'}
              onChange={(e) => handleUpdateStyle('stroke', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border border-gray-600"
            />
            <input
              type="text"
              value={selectedElement.style.stroke || '#000000'}
              onChange={(e) => handleUpdateStyle('stroke', e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono text-xs"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Stroke Width
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={selectedElement.style.strokeWidth || 1}
            onChange={(e) => handleUpdateStyle('strokeWidth', parseFloat(e.target.value))}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Opacity
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedElement.style.opacity || 1}
              onChange={(e) => handleUpdateStyle('opacity', parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-400 w-12 text-right">
              {Math.round((selectedElement.style.opacity || 1) * 100)}%
            </span>
          </div>
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                Text Content
              </label>
              <textarea
                value={selectedElement.content || ''}
                onChange={(e) => handleUpdateProperty('content', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                Font Size
              </label>
              <input
                type="number"
                min="8"
                max="72"
                value={selectedElement.style.fontSize || 16}
                onChange={(e) => handleUpdateStyle('fontSize', parseFloat(e.target.value))}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                Font Family
              </label>
              <select
                value={selectedElement.style.fontFamily || 'Arial'}
                onChange={(e) => handleUpdateStyle('fontFamily', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Georgia</option>
                <option>Verdana</option>
              </select>
            </div>
          </>
        )}

        {/* Z-Index */}
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            Z-Index
          </label>
          <input
            type="number"
            value={selectedElement.zIndex}
            onChange={(e) => updateElement(selectedElement.id, { zIndex: parseInt(e.target.value) })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Footer - Action Buttons */}
      <div className="border-t border-gray-700 p-4 flex gap-2">
        <button
          onClick={handleDuplicate}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300 text-sm"
          title="Duplicate element"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={() => deleteElement(selectedElement.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors text-white text-sm"
          title="Delete element"
        >
          <Delete className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
