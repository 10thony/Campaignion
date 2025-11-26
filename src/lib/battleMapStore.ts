import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Id } from "../../convex/_generated/dataModel";

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

export interface InitiativeEntry {
  tokenId: string;
  label: string;
  roll: number;
  modifier: number;
  total: number;
  dexterityScore: number;
  type: "pc" | "npc_friendly" | "npc_foe";
  characterId?: Id<"characters">;
  monsterId?: Id<"monsters">;
}

type InitiativeState = {
  initiativeOrder: InitiativeEntry[];
  currentTurnIndex: number | null;
  isInCombat: boolean;
  roundNumber: number;
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
  // Initiative functionality
  initiativeState: InitiativeState;
  setInitiativeOrder: (order: InitiativeEntry[]) => void;
  setCurrentTurnIndex: (index: number | null) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  startCombat: () => void;
  endCombat: () => void;
  // Battle map instance management
  currentInstanceId: string | null;
  setCurrentInstanceId: (id: string | null) => void;
  // View control
  resetView: boolean;
  triggerResetView: () => void;
};

export const useBattleMapUI = create<UIState>()(
  immer((set) => ({
    selectedMapId: null,
    setSelectedMapId: (id) => set((s) => {
      const previousMapId = s.selectedMapId;
      s.selectedMapId = id;
      // Clear initiative state when switching to a different map or clearing selection
      if (previousMapId !== id) {
        s.initiativeState = {
          initiativeOrder: [],
          currentTurnIndex: null,
          isInCombat: false,
          roundNumber: 1,
        };
        // Also clear combat state
        s.combatState.attackerTokenId = null;
        s.combatState.targetTokenId = null;
        s.combatState.availableActions = [];
        s.combatState.selectedAction = null;
        s.combatState.isCombatMode = false;
        // Clear current instance ID as well since it's map-specific
        s.currentInstanceId = null;
      }
    }),
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
    // Initiative functionality
    initiativeState: {
      initiativeOrder: [],
      currentTurnIndex: null,
      isInCombat: false,
      roundNumber: 1,
    },
    setInitiativeOrder: (order) => set((s) => {
      s.initiativeState.initiativeOrder = order;
      if (order.length > 0 && s.initiativeState.currentTurnIndex === null) {
        s.initiativeState.currentTurnIndex = 0;
      }
    }),
    setCurrentTurnIndex: (index) => set((s) => void (s.initiativeState.currentTurnIndex = index)),
    nextTurn: () => set((s) => {
      if (s.initiativeState.initiativeOrder.length === 0) return;
      const currentIndex = s.initiativeState.currentTurnIndex ?? 0;
      const nextIndex = (currentIndex + 1) % s.initiativeState.initiativeOrder.length;
      s.initiativeState.currentTurnIndex = nextIndex;
      if (nextIndex === 0) {
        s.initiativeState.roundNumber += 1;
      }
    }),
    previousTurn: () => set((s) => {
      if (s.initiativeState.initiativeOrder.length === 0) return;
      const currentIndex = s.initiativeState.currentTurnIndex ?? 0;
      const prevIndex = currentIndex === 0 
        ? s.initiativeState.initiativeOrder.length - 1 
        : currentIndex - 1;
      s.initiativeState.currentTurnIndex = prevIndex;
      if (prevIndex === s.initiativeState.initiativeOrder.length - 1) {
        s.initiativeState.roundNumber = Math.max(1, s.initiativeState.roundNumber - 1);
      }
    }),
    startCombat: () => set((s) => {
      s.initiativeState.isInCombat = true;
      s.initiativeState.roundNumber = 1;
      if (s.initiativeState.initiativeOrder.length > 0) {
        s.initiativeState.currentTurnIndex = 0;
      }
    }),
    endCombat: () => set((s) => {
      s.initiativeState.isInCombat = false;
      s.initiativeState.currentTurnIndex = null;
      s.initiativeState.roundNumber = 1;
    }),
    // Battle map instance management
    currentInstanceId: null,
    setCurrentInstanceId: (id) => set((s) => void (s.currentInstanceId = id)),
    // View control
    resetView: false,
    triggerResetView: () => set((s) => void (s.resetView = !s.resetView)),
  }))
);
