'use client';

import React, { useRef } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import {
  Download,
  FileJson,
  FileImage,
  PlusSquare,
  Undo2,
  Redo2,
  Plus,
  Save,
  FileText,
} from 'lucide-react';
import {
  exportToPDF,
  exportToPNG,
  exportToSVG,
  exportToHTML,
  exportToJSON,
  importFromJSON,
} from '@/lib/canvas/export';

export default function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { project, undo, redo, setProject } = useCanvasStore();
  const svgRef = useRef<SVGSVGElement>(null);

  if (!project) return null;

  const handleExportPDF = async () => {
    if (!svgRef.current) return;
    try {
      await exportToPDF(project, svgRef.current);
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  const handleExportPNG = async () => {
    if (!svgRef.current) return;
    try {
      await exportToPNG(project, svgRef.current);
    } catch (error) {
      alert('Failed to export PNG');
    }
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    try {
      exportToSVG(project, svgRef.current);
    } catch (error) {
      alert('Failed to export SVG');
    }
  };

  const handleExportHTML = () => {
    if (!svgRef.current) return;
    try {
      exportToHTML(project, svgRef.current);
    } catch (error) {
      alert('Failed to export HTML');
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(project);
    } catch (error) {
      alert('Failed to export JSON');
    }
  };

  const handleImportJSON = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedProject = await importFromJSON(file);
      setProject(importedProject);
    } catch (error) {
      alert('Failed to import project');
    }
  };

  return (
    <>
      <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6 space-x-4">
        {/* Left: Project name and new */}
        <div className="flex items-center gap-4">
          <div>
            <input
              type="text"
              defaultValue={project.name}
              className="bg-gray-800 text-white font-semibold px-3 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Project name"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white text-sm font-medium"
            title="New Project"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Center: Edit actions */}
        <div className="flex items-center gap-2 border-l border-r border-gray-700 px-4">
          <button
            onClick={undo}
            className="p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            className="p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Export actions */}
        <div className="flex items-center gap-2">
          {/* Save/Import */}
          <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
            <button
              onClick={handleImportJSON}
              className="p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Import JSON project"
            >
              <FileJson className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJSON}
              className="p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Export as JSON"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          {/* Export buttons */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded transition-colors text-white text-xs font-medium"
            title="Export as PDF"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>

          <button
            onClick={handleExportPNG}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded transition-colors text-white text-xs font-medium"
            title="Export as PNG"
          >
            <FileImage className="w-4 h-4" />
            PNG
          </button>

          <button
            onClick={handleExportSVG}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 rounded transition-colors text-white text-xs font-medium"
            title="Export as SVG"
          >
            <FileText className="w-4 h-4" />
            SVG
          </button>

          <button
            onClick={handleExportHTML}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded transition-colors text-white text-xs font-medium"
            title="Export as HTML"
          >
            <FileText className="w-4 h-4" />
            HTML
          </button>
        </div>
      </div>

      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Hidden SVG reference for exports - will be attached to Canvas */}
      <svg
        ref={svgRef}
        style={{ display: 'none' }}
        width={project.width}
        height={project.height}
      />
    </>
  );
}
