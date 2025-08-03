import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapActionSelector } from '../MapActionSelector';

// Mock the movement validator
vi.mock('@/lib/mapMovementValidator', () => ({
  MapMovementValidator: {
    validateMovement: vi.fn(() => ({ isValid: true, cost: 2, path: [] })),
    validateAttack: vi.fn(() => ({ isValid: true, range: 3, hasLineOfSight: true })),
  },
  MapUtils: {
    positionToKey: vi.fn((pos) => `${pos.x},${pos.y}`),
  },
}));

const mockParticipant = {
  entityId: 'player1',
  entityType: 'playerCharacter' as const,
  userId: 'user1',
  currentHP: 45,
  maxHP: 50,
  position: { x: 2, y: 2 },
  conditions: [],
  inventory: {
    items: [
      { id: 'item1', itemId: 'sword', quantity: 1, properties: {} },
      { id: 'item2', itemId: 'potion', quantity: 3, properties: {} },
    ],
    equippedItems: { mainHand: 'sword' },
    capacity: 20,
  },
  availableActions: [
    { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] },
    { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] },
    { id: 'useItem', name: 'Use Item', type: 'useItem' as const, available: true, requirements: [] },
    { id: 'cast', name: 'Cast Spell', type: 'cast' as const, available: true, requirements: [] },
  ],
  turnStatus: 'active' as const,
};

const mockAvailableTargets = [
  {
    entityId: 'monster1',
    entityType: 'monster' as const,
    currentHP: 30,
    maxHP: 35,
    position: { x: 5, y: 5 },
  },
  {
    entityId: 'monster2',
    entityType: 'monster' as const,
    currentHP: 15,
    maxHP: 20,
    position: { x: 8, y: 8 },
  },
];

const mockAvailableItems = [
  { id: 'item1', itemId: 'sword', name: 'Iron Sword', quantity: 1, usable: true },
  { id: 'item2', itemId: 'potion', name: 'Health Potion', quantity: 3, usable: true },
];

const mockMapState = {
  width: 10,
  height: 10,
  entities: {
    'player1': { entityId: 'player1', position: { x: 2, y: 2 } },
    'monster1': { entityId: 'monster1', position: { x: 5, y: 5 } },
    'monster2': { entityId: 'monster2', position: { x: 8, y: 8 } },
  },
  obstacles: [{ x: 3, y: 3 }],
  terrain: [],
};

const defaultProps = {
  participant: mockParticipant,
  selectedAction: null,
  selectedTarget: null,
  selectedPosition: null,
  onActionSelect: vi.fn(),
  onTargetSelect: vi.fn(),
  onPositionSelect: vi.fn(),
  onSubmitAction: vi.fn(),
  onClearSelection: vi.fn(),
  availableTargets: mockAvailableTargets,
  availableItems: mockAvailableItems,
  validationErrors: [],
  isSubmitting: false,
  mapState: mockMapState,
};

describe('MapActionSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders available actions grouped by type', () => {
    render(<MapActionSelector {...defaultProps} />);
    
    expect(screen.getByText('Action Selection')).toBeInTheDocument();
    expect(screen.getByText('Movement')).toBeInTheDocument();
    expect(screen.getByText('Attacks')).toBeInTheDocument();
    expect(screen.getByText('Use Item')).toBeInTheDocument();
    expect(screen.getByText('Spells')).toBeInTheDocument();
    
    expect(screen.getByText('Move')).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Cast Spell')).toBeInTheDocument();
  });

  it('shows movement configuration when move action is selected', () => {
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    
    render(<MapActionSelector {...defaultProps} selectedAction={selectedAction} />);
    
    expect(screen.getByText('Move - Configuration')).toBeInTheDocument();
    expect(screen.getByText('Click on the map to select your destination.')).toBeInTheDocument();
    expect(screen.getByText('Movement range: 6 cells')).toBeInTheDocument();
  });

  it('shows attack configuration with target information', () => {
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] };
    
    render(<MapActionSelector {...defaultProps} selectedAction={selectedAction} />);
    
    expect(screen.getByText('Attack - Configuration')).toBeInTheDocument();
    expect(screen.getByText('Select a target to attack:')).toBeInTheDocument();
    expect(screen.getByText('Attack range: 1 cells')).toBeInTheDocument(); // Melee weapon
    
    expect(screen.getByText('monster1')).toBeInTheDocument();
    expect(screen.getByText('30/35 HP')).toBeInTheDocument();
    expect(screen.getByText('monster2')).toBeInTheDocument();
    expect(screen.getByText('15/20 HP')).toBeInTheDocument();
  });

  it('shows distance and line of sight information for attack targets', async () => {
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] };
    
    render(<MapActionSelector {...defaultProps} selectedAction={selectedAction} />);
    
    // Check distance calculations
    expect(screen.getByText('6 cells')).toBeInTheDocument(); // Distance to monster1 (|5-2| + |5-2| = 6)
    expect(screen.getByText('12 cells')).toBeInTheDocument(); // Distance to monster2 (|8-2| + |8-2| = 12)
  });

  it('disables out-of-range targets for attacks', async () => {
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] };
    
    render(<MapActionSelector {...defaultProps} selectedAction={selectedAction} />);
    
    const monster1Button = screen.getByRole('button', { name: /monster1/ });
    const monster2Button = screen.getByRole('button', { name: /monster2/ });
    
    // monster1 is at distance 6, which is > attack range of 1, so should be disabled
    // monster2 is at distance 12, which is > attack range of 1, so should be disabled
    expect(monster1Button).toBeDisabled();
    expect(monster2Button).toBeDisabled();
  });

  it('shows item selection interface', () => {
    const selectedAction = { id: 'useItem', name: 'Use Item', type: 'useItem' as const, available: true, requirements: [] };
    
    render(<MapActionSelector {...defaultProps} selectedAction={selectedAction} />);
    
    expect(screen.getByText('Use Item - Configuration')).toBeInTheDocument();
    expect(screen.getByText('Select an item to use:')).toBeInTheDocument();
    
    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Quantity badge
  });

  it('shows validation errors', () => {
    const validationErrors = ['Target is out of range', 'No line of sight to target'];
    
    render(<MapActionSelector {...defaultProps} validationErrors={validationErrors} />);
    
    expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
    expect(screen.getByText('Target is out of range')).toBeInTheDocument();
    expect(screen.getByText('No line of sight to target')).toBeInTheDocument();
  });

  it('enables submit button only when action is valid', async () => {
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    const selectedPosition = { x: 3, y: 3 };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        selectedPosition={selectedPosition}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /Submit Move/ });
    expect(submitButton).toBeEnabled();
  });

  it('disables submit button when action is invalid', async () => {
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    
    // Mock invalid movement
    const { MapMovementValidator } = await import('@/lib/mapMovementValidator');
    vi.mocked(MapMovementValidator.validateMovement).mockReturnValue({
      isValid: false,
      reason: 'Destination is occupied',
    });
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        selectedPosition={{ x: 3, y: 3 }}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /Submit Move/ });
    expect(submitButton).toBeDisabled();
  });

  it('shows movement cost and distance information', () => {
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    const selectedPosition = { x: 4, y: 4 };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        selectedPosition={selectedPosition}
      />
    );
    
    expect(screen.getByText('Destination: (4, 4)')).toBeInTheDocument();
    expect(screen.getByText('Distance: 4 cells')).toBeInTheDocument(); // |4-2| + |4-2| = 4
    expect(screen.getByText('(Cost: 2)')).toBeInTheDocument(); // From mocked validator
  });

  it('calls onActionSelect when action is clicked', () => {
    const mockOnActionSelect = vi.fn();
    
    render(<MapActionSelector {...defaultProps} onActionSelect={mockOnActionSelect} />);
    
    const moveButton = screen.getByRole('button', { name: /Move/ });
    fireEvent.click(moveButton);
    
    expect(mockOnActionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'move', name: 'Move', type: 'move' })
    );
  });

  it('calls onTargetSelect when target is clicked', () => {
    const mockOnTargetSelect = vi.fn();
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        onTargetSelect={mockOnTargetSelect}
      />
    );
    
    const targetButton = screen.getByRole('button', { name: /monster1/ });
    fireEvent.click(targetButton);
    
    expect(mockOnTargetSelect).toHaveBeenCalledWith('monster1');
  });

  it('calls onSubmitAction when submit button is clicked', async () => {
    const mockOnSubmitAction = vi.fn();
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    const selectedPosition = { x: 3, y: 3 };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        selectedPosition={selectedPosition}
        onSubmitAction={mockOnSubmitAction}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /Submit Move/ });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmitAction).toHaveBeenCalledWith({
      type: 'move',
      entityId: 'player1',
      actionId: 'move',
      position: { x: 3, y: 3 },
    });
  });

  it('shows clear button when action is selected', () => {
    const mockOnClearSelection = vi.fn();
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        selectedAction={selectedAction}
        onClearSelection={mockOnClearSelection}
      />
    );
    
    const clearButton = screen.getByRole('button', { name: /Clear/ });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('handles conditions affecting movement range', () => {
    const participantWithHaste = {
      ...mockParticipant,
      conditions: [
        { id: '1', name: 'Haste', duration: 5, effects: {} },
      ],
    };
    
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        participant={participantWithHaste}
        selectedAction={selectedAction}
      />
    );
    
    expect(screen.getByText('Movement range: 9 cells')).toBeInTheDocument(); // 6 + 3 from haste
  });

  it('handles ranged weapons for attack range', () => {
    const participantWithBow = {
      ...mockParticipant,
      inventory: {
        ...mockParticipant.inventory,
        equippedItems: { mainHand: 'longbow' },
      },
    };
    
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] };
    
    render(
      <MapActionSelector 
        {...defaultProps} 
        participant={participantWithBow}
        selectedAction={selectedAction}
      />
    );
    
    expect(screen.getByText('Attack range: 10 cells')).toBeInTheDocument(); // Ranged weapon
  });
});