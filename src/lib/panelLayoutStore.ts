import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PanelId = "controls" | "terrain" | "initiative" | "combat" | "zoom";

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelConfig {
  id: PanelId;
  position: PanelPosition;
  isVisible: boolean;
  isMinimized: boolean;
  zIndex: number;
}

interface PanelLayoutState {
  panels: Record<PanelId, PanelConfig>;
  maxZIndex: number;
  
  // Actions
  updatePanelPosition: (id: PanelId, position: PanelPosition) => void;
  togglePanelVisibility: (id: PanelId) => void;
  togglePanelMinimized: (id: PanelId) => void;
  showPanel: (id: PanelId) => void;
  hidePanel: (id: PanelId) => void;
  bringToFront: (id: PanelId) => void;
  resetLayout: () => void;
  setAllPanelsVisible: (visible: boolean) => void;
}

// Default panel positions (relative to their anchors)
const defaultPanels: Record<PanelId, PanelConfig> = {
  controls: {
    id: "controls",
    position: { x: -16, y: 16 }, // Offset from top-right
    isVisible: true,
    isMinimized: false,
    zIndex: 10,
  },
  terrain: {
    id: "terrain",
    position: { x: -16, y: 280 }, // Below controls
    isVisible: true,
    isMinimized: false,
    zIndex: 10,
  },
  initiative: {
    id: "initiative",
    position: { x: 16, y: 16 }, // Top-left
    isVisible: true,
    isMinimized: false,
    zIndex: 20,
  },
  combat: {
    id: "combat",
    position: { x: 360, y: 16 }, // Next to initiative
    isVisible: true,
    isMinimized: false,
    zIndex: 20,
  },
  zoom: {
    id: "zoom",
    position: { x: -16, y: -16 }, // Bottom-right
    isVisible: true,
    isMinimized: false,
    zIndex: 10,
  },
};

export const usePanelLayout = create<PanelLayoutState>()(
  persist(
    (set) => ({
      panels: { ...defaultPanels },
      maxZIndex: 20,
      
      updatePanelPosition: (id, position) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], position },
          },
        })),
      
      togglePanelVisibility: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], isVisible: !state.panels[id].isVisible },
          },
        })),
      
      togglePanelMinimized: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], isMinimized: !state.panels[id].isMinimized },
          },
        })),
      
      showPanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], isVisible: true, isMinimized: false },
          },
        })),
      
      hidePanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], isVisible: false },
          },
        })),
      
      bringToFront: (id) =>
        set((state) => {
          const newMaxZIndex = state.maxZIndex + 1;
          return {
            maxZIndex: newMaxZIndex,
            panels: {
              ...state.panels,
              [id]: { ...state.panels[id], zIndex: newMaxZIndex },
            },
          };
        }),
      
      resetLayout: () =>
        set(() => ({
          panels: { ...defaultPanels },
          maxZIndex: 20,
        })),
      
      setAllPanelsVisible: (visible) =>
        set((state) => {
          const updatedPanels = { ...state.panels };
          (Object.keys(updatedPanels) as PanelId[]).forEach((id) => {
            updatedPanels[id] = { ...updatedPanels[id], isVisible: visible };
          });
          return { panels: updatedPanels };
        }),
    }),
    {
      name: "campaignion-panel-layout",
      version: 1,
    }
  )
);

