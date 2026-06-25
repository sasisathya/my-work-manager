/**
 * Canvas state management using Zustand
 * Handles project data, elements, selection, and history
 */

import { create } from 'zustand';
import { CanvasState, CanvasProject, CanvasElement } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialProject: CanvasProject = {
  id: generateId(),
  name: 'Untitled Project',
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
  elements: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useCanvasStore = create<CanvasState>(
  (set, get) => ({
      // Initial state
      project: initialProject,
      elements: [],
      selectedElementId: null,
      hoveredElementId: null,
      isDragging: false,
      history: [[]],
      historyIndex: 0,

      // Project operations
      setProject: (project: CanvasProject) => {
        set({ project, elements: project.elements });
      },

      newProject: (name: string, width: number, height: number) => {
        const newProject: CanvasProject = {
          id: generateId(),
          name,
          width,
          height,
          backgroundColor: '#ffffff',
          elements: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({
          project: newProject,
          elements: [],
          selectedElementId: null,
          history: [[]],
          historyIndex: 0,
        });
      },

      // Element operations
      addElement: (element: CanvasElement) => {
        const newElements = [...get().elements, element];
        get().addToHistory(newElements);
        set({ elements: newElements });
      },

      updateElement: (id: string, updates: Partial<CanvasElement>) => {
        const newElements = get().elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        );
        get().addToHistory(newElements);
        set({ elements: newElements });
      },

      deleteElement: (id: string) => {
        const newElements = get().elements.filter((el) => el.id !== id);
        get().addToHistory(newElements);
        set({
          elements: newElements,
          selectedElementId: get().selectedElementId === id ? null : get().selectedElementId,
        });
      },

      moveElement: (id: string, x: number, y: number) => {
        const newElements = get().elements.map((el) =>
          el.id === id ? { ...el, position: { x, y } } : el
        );
        set({ elements: newElements });
      },

      // Selection
      selectElement: (id: string | null) => {
        set({ selectedElementId: id });
      },

      // Z-index operations
      bringToFront: (id: string) => {
        const maxZIndex = Math.max(...get().elements.map((el) => el.zIndex), 0);
        get().updateElement(id, { zIndex: maxZIndex + 1 });
      },

      sendToBack: (id: string) => {
        const minZIndex = Math.min(...get().elements.map((el) => el.zIndex), 0);
        get().updateElement(id, { zIndex: minZIndex - 1 });
      },

      increaseZIndex: (id: string) => {
        const element = get().elements.find((el) => el.id === id);
        if (!element) return;
        const nextZIndex = element.zIndex + 1;
        get().updateElement(id, { zIndex: nextZIndex });
      },

      decreaseZIndex: (id: string) => {
        const element = get().elements.find((el) => el.id === id);
        if (!element) return;
        const prevZIndex = element.zIndex - 1;
        get().updateElement(id, { zIndex: prevZIndex });
      },

      // History operations
      addToHistory: (elements: CanvasElement[]) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(elements);
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          set({
            elements: state.history[newIndex],
            historyIndex: newIndex,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          set({
            elements: state.history[newIndex],
            historyIndex: newIndex,
          });
        }
      },
    })
);
