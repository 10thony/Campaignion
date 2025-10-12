import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type EditingMode = "token" | "terrain" | "measure" | "aoe" | null;
type TerrainType = "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable";
type AoeType = "sphere" | "cube" | "cone" | "line";

type UIState = {
  selectedMapId: string | null;
  setSelectedMapId: (id: string | null) => void;
  showNewMap: boolean;
  setShowNewMap: (v: boolean) => void;
  editingTokenId: string | null;
  setEditingTokenId: (id: string | null) => void;
  enforceSingleOccupancy: boolean;
  setEnforceSingleOccupancy: (v: boolean) => void;
  editingMode: EditingMode;
  setEditingMode: (mode: EditingMode) => void;
  selectedTerrain: TerrainType;
  setSelectedTerrain: (terrain: TerrainType) => void;
  measurePoints: Array<{ x: number; y: number }>;
  setMeasurePoints: (points: Array<{ x: number; y: number }>) => void;
  clearMeasurePoints: () => void;
  aoeTemplate: { type: AoeType; size: number } | null;
  setAoeTemplate: (template: { type: AoeType; size: number } | null) => void;
  selectedTokenForMovement: string | null;
  setSelectedTokenForMovement: (tokenId: string | null) => void;
};

export const useBattleMapUI = create<UIState>()(
  immer((set) => ({
    selectedMapId: null,
    setSelectedMapId: (id) => set((s) => void (s.selectedMapId = id)),
    showNewMap: false,
    setShowNewMap: (v) => set((s) => void (s.showNewMap = v)),
    editingTokenId: null,
    setEditingTokenId: (id) => set((s) => void (s.editingTokenId = id)),
    enforceSingleOccupancy: false,
    setEnforceSingleOccupancy: (v) =>
      set((s) => void (s.enforceSingleOccupancy = v)),
    editingMode: null,
    setEditingMode: (mode) => set((s) => void (s.editingMode = mode)),
    selectedTerrain: "normal",
    setSelectedTerrain: (terrain) => set((s) => void (s.selectedTerrain = terrain)),
    measurePoints: [],
    setMeasurePoints: (points) => set((s) => void (s.measurePoints = points)),
    clearMeasurePoints: () => set((s) => void (s.measurePoints = [])),
    aoeTemplate: null,
    setAoeTemplate: (template) => set((s) => void (s.aoeTemplate = template)),
    selectedTokenForMovement: null,
    setSelectedTokenForMovement: (tokenId) => set((s) => void (s.selectedTokenForMovement = tokenId)),
  }))
);
