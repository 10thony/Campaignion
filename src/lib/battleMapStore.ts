import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type EditingMode = "token" | "terrain" | "measure" | "aoe" | "multiselect" | null;
type TerrainType = "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable";
type AoeType = "sphere" | "cube" | "cone" | "line";

type CombatState = {
  attackerTokenId: string | null;
  targetTokenId: string | null;
  availableActions: any[]; // Will be populated with actions from character/monster
  selectedAction: any | null;
  isCombatMode: boolean;
};

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
  // Multi-select functionality
  selectedCells: Set<string>; // Set of "x,y" strings
  setSelectedCells: (cells: Set<string>) => void;
  addSelectedCell: (x: number, y: number) => void;
  removeSelectedCell: (x: number, y: number) => void;
  clearSelectedCells: () => void;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (enabled: boolean) => void;
  // Combat functionality
  combatState: CombatState;
  setAttackerToken: (tokenId: string | null) => void;
  setTargetToken: (tokenId: string | null) => void;
  setAvailableActions: (actions: any[]) => void;
  setSelectedAction: (action: any | null) => void;
  setIsCombatMode: (enabled: boolean) => void;
  clearCombatState: () => void;
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
    // Multi-select functionality
    selectedCells: new Set<string>(),
    setSelectedCells: (cells) => set((s) => void (s.selectedCells = cells)),
    addSelectedCell: (x, y) => set((s) => void (s.selectedCells.add(`${x},${y}`))),
    removeSelectedCell: (x, y) => set((s) => void (s.selectedCells.delete(`${x},${y}`))),
    clearSelectedCells: () => set((s) => void (s.selectedCells.clear())),
    isMultiSelectMode: false,
    setIsMultiSelectMode: (enabled) => set((s) => void (s.isMultiSelectMode = enabled)),
    // Combat functionality
    combatState: {
      attackerTokenId: null,
      targetTokenId: null,
      availableActions: [],
      selectedAction: null,
      isCombatMode: false,
    },
    setAttackerToken: (tokenId) => set((s) => void (s.combatState.attackerTokenId = tokenId)),
    setTargetToken: (tokenId) => set((s) => void (s.combatState.targetTokenId = tokenId)),
    setAvailableActions: (actions) => set((s) => void (s.combatState.availableActions = actions)),
    setSelectedAction: (action) => set((s) => void (s.combatState.selectedAction = action)),
    setIsCombatMode: (enabled) => set((s) => void (s.combatState.isCombatMode = enabled)),
    clearCombatState: () => set((s) => {
      s.combatState.attackerTokenId = null;
      s.combatState.targetTokenId = null;
      s.combatState.availableActions = [];
      s.combatState.selectedAction = null;
      s.combatState.isCombatMode = false;
    }),
  }))
);
