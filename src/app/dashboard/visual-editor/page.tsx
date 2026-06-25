'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import ElementLibrary from './components/ElementLibrary';
import LayersPanel from './components/LayersPanel';
import PropertiesInspector from './components/PropertiesInspector';

export default function VisualEditorPage() {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const { project, newProject } = useCanvasStore();

  // Initialize project on mount
  useEffect(() => {
    if (!project) {
      newProject('Untitled Design', 1200, 800);
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Element Library */}
        <ElementLibrary />

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas onElementSelect={setSelectedElementId} />
        </div>

        {/* Right panel - Layers */}
        <LayersPanel />

        {/* Far right - Properties Inspector */}
        <PropertiesInspector />
      </div>

      {/* Keyboard shortcuts info */}
      <style jsx>{`
        :global(body) {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
