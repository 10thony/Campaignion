import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveMapView } from '../LiveMapView';

// Mock the MapPreview component
vi.mock('../MapPreview', () => ({
  MapPreview: vi.fn(({ onCellClick, onCellHover, onCellLeave, map }) => (
    <div data-testid="map-preview">
      <div data-testid="map-cells">
        {map?.cells?.map((cell: any) => (
          <div
            key={`${cell.x}-${cell.y}`}
            data-testid={`cell-${cell.x}-${cell.y}`}
            onClick={() => onCellClick?.(cell.x, cell.y)}
            onMouseEnter={() => onCellHover?.(cell.x, cell.y)}
            onMouseLeave={() => onCellLeave?.()}
            style={{ backgroundColor: cell.customColor }}
          >
            {cell.occupant?.name}
          </div>
        ))}
      </div>
    </div>
  )),
}));

// Mock the movement validator
vi.mock('@/lib/mapMovementValidator', () => ({
  MapMovementValidator: {
    validateMovement: vi.fn(() => ({ isValid: true, cost: 2, path: [] })),
    validateAttack: vi.fn(() => ({ isValid: true, range: 3, hasLineOfSight: true })),
    getValidMovementPositions: vi.fn(() => new Set(['1,1', '2,2', '3,3'])),
    getValidAttackTargets: vi.fn(() => new Set(['5,5', '6,6'])),
  },
  MapUtils: {
    positionToKey: vi.fn((pos) => `${pos.x},${pos.y}`),
    keyToPosition: vi.fn((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    }),
  },
}));

const mockMapState = {
  width: 10,
  height: 10,
  entities: {
    'player1': { entityId: 'player1', position: { x: 2, y: 2 } },
    'monster1': { entityId: 'monster1', position: { x: 5, y: 5 } },
  },
  obstacles: [{ x: 3, y: 3 }],
  terrain: [{ position: { x: 4, y: 4 }, type: 'rough', properties: {} }],
};

const mockParticipants = {
  'player1': {
    entityId: 'player1',
    entityType: 'playerCharacter' as const,
    userId: 'user1',
    currentHP: 45,
    maxHP: 50,
    position: { x: 2, y: 2 },
    conditions: [],
    inventory: {
      items: [],
      equippedItems: {},
      capacity: 20,
    },
    availableActions: [
      { id: 'move', name: 'Move', type: 'move' as const, available: true, requirements: [] },
      { id: 'attack', name: 'Attack', type: 'attack' as const, available: true, requirements: [] },
    ],
    turnStatus: 'active' as const,
  },
  'monster1': {
    entityId: 'monster1',
    entityType: 'monster' as const,
    currentHP: 30,
    maxHP: 35,
    position: { x: 5, y: 5 },
    conditions: [],
    inventory: {
      items: [],
      equippedItems: {},
      capacity: 0,
    },
    availableActions: [],
    turnStatus: 'waiting' as const,
  },
};

const mockInitiativeOrder = [
  { entityId: 'player1', entityType: 'playerCharacter' as const, initiative: 18, userId: 'user1' },
  { entityId: 'monster1', entityType: 'monster' as const, initiative: 15 },
];

const defaultProps = {
  mapState: mockMapState,
  participants: mockParticipants,
  initiativeOrder: mockInitiativeOrder,
  currentTurnIndex: 0,
  currentUserId: 'user1',
  isMyTurn: true,
};

describe('LiveMapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map with basic information', () => {
    render(<LiveMapView {...defaultProps} />);
    
    expect(screen.getByText('Battle Map')).toBeInTheDocument();
    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
    expect(screen.getByText("player1's Turn")).toBeInTheDocument();
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });

  it('displays validation errors when movement is invalid', async () => {
    const mockOnCellClick = vi.fn();
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true };
    
    // Mock invalid movement
    const { MapMovementValidator } = await import('@/lib/mapMovementValidator');
    vi.mocked(MapMovementValidator.validateMovement).mockReturnValue({
      isValid: false,
      reason: 'Destination is occupied by another entity',
    });

    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        onCellClick={mockOnCellClick}
      />
    );
    
    // Click on a cell
    const cell = screen.getByTestId('cell-3-3');
    fireEvent.click(cell);
    
    await waitFor(() => {
      expect(screen.getByText('Action Invalid:')).toBeInTheDocument();
      expect(screen.getByText('Destination is occupied by another entity')).toBeInTheDocument();
    });
  });

  it('shows movement range highlighting when move action is selected', () => {
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true };
    
    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        showMovementRange={true}
      />
    );
    
    expect(screen.getByText('Select destination to move')).toBeInTheDocument();
    expect(screen.getByText('Green highlighted cells show valid movement positions')).toBeInTheDocument();
    expect(screen.getByText('Movement range: 6 cells')).toBeInTheDocument();
  });

  it('shows attack range highlighting when attack action is selected', () => {
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true };
    
    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        showAttackRange={true}
      />
    );
    
    expect(screen.getByText('Select target to attack')).toBeInTheDocument();
    expect(screen.getByText('Red highlighted cells show valid attack targets')).toBeInTheDocument();
    expect(screen.getByText('Attack range: 5 cells')).toBeInTheDocument();
  });

  it('displays entity status information', () => {
    render(<LiveMapView {...defaultProps} />);
    
    expect(screen.getByText('player1 (You)')).toBeInTheDocument();
    expect(screen.getByText('45/50 HP')).toBeInTheDocument();
    expect(screen.getByText('(2, 2)')).toBeInTheDocument();
    
    // Use getAllByText for elements that appear multiple times
    const monster1Elements = screen.getAllByText('monster1');
    expect(monster1Elements.length).toBeGreaterThan(0);
    expect(screen.getByText('30/35 HP')).toBeInTheDocument();
    expect(screen.getByText('(5, 5)')).toBeInTheDocument();
  });

  it('shows hover information when hovering over cells', async () => {
    render(<LiveMapView {...defaultProps} />);
    
    const cell = screen.getByTestId('cell-2-2');
    fireEvent.mouseEnter(cell);
    
    await waitFor(() => {
      expect(screen.getByText('Cell (2, 2)')).toBeInTheDocument();
      expect(screen.getByText('player1 (playerCharacter)')).toBeInTheDocument();
      expect(screen.getByText('HP: 45/50')).toBeInTheDocument();
    });
    
    fireEvent.mouseLeave(cell);
    
    await waitFor(() => {
      expect(screen.queryByText('Cell (2, 2)')).not.toBeInTheDocument();
    });
  });

  it('calls onSubmitAction when valid movement is selected', async () => {
    const mockOnSubmitAction = vi.fn();
    const selectedAction = { id: 'move', name: 'Move', type: 'move' as const, available: true };
    
    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        onSubmitAction={mockOnSubmitAction}
      />
    );
    
    const cell = screen.getByTestId('cell-3-3');
    fireEvent.click(cell);
    
    await waitFor(() => {
      expect(mockOnSubmitAction).toHaveBeenCalledWith({
        type: 'move',
        entityId: 'player1',
        position: { x: 3, y: 3 },
        actionId: 'move',
      });
    });
  });

  it('calls onTargetSelect when valid attack target is selected', async () => {
    const mockOnTargetSelect = vi.fn();
    const selectedAction = { id: 'attack', name: 'Attack', type: 'attack' as const, available: true };
    
    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        onTargetSelect={mockOnTargetSelect}
      />
    );
    
    const cell = screen.getByTestId('cell-5-5');
    fireEvent.click(cell);
    
    await waitFor(() => {
      expect(mockOnTargetSelect).toHaveBeenCalledWith('monster1');
    });
  });

  it('displays legend with all visual indicators', () => {
    render(<LiveMapView {...defaultProps} />);
    
    expect(screen.getByText('Valid Movement')).toBeInTheDocument();
    expect(screen.getByText('Attack Range')).toBeInTheDocument();
    expect(screen.getByText('Spell/Item Range')).toBeInTheDocument();
    expect(screen.getByText('Selected Target')).toBeInTheDocument();
    expect(screen.getByText('Selected Position')).toBeInTheDocument();
    expect(screen.getByText('Obstacles')).toBeInTheDocument();
    expect(screen.getByText('Current Turn')).toBeInTheDocument();
    expect(screen.getByText('Status Effects')).toBeInTheDocument();
  });

  it('handles spell targeting correctly', async () => {
    const mockOnTargetSelect = vi.fn();
    const selectedAction = { id: 'fireball', name: 'Fireball', type: 'cast' as const, available: true };
    
    render(
      <LiveMapView 
        {...defaultProps} 
        selectedAction={selectedAction}
        onTargetSelect={mockOnTargetSelect}
      />
    );
    
    expect(screen.getByText('Select target for spell')).toBeInTheDocument();
    expect(screen.getByText('Purple highlighted cells show targeting range')).toBeInTheDocument();
    
    const cell = screen.getByTestId('cell-5-5');
    fireEvent.click(cell);
    
    await waitFor(() => {
      expect(mockOnTargetSelect).toHaveBeenCalledWith('monster1');
    });
  });

  it('shows different visual indicators for different entity types', () => {
    const participantsWithNPC = {
      ...mockParticipants,
      'npc1': {
        entityId: 'npc1',
        entityType: 'npc' as const,
        currentHP: 25,
        maxHP: 30,
        position: { x: 7, y: 7 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 0 },
        availableActions: [],
        turnStatus: 'waiting' as const,
      },
    };

    const mapStateWithNPC = {
      ...mockMapState,
      entities: {
        ...mockMapState.entities,
        'npc1': { entityId: 'npc1', position: { x: 7, y: 7 } },
      },
    };

    render(
      <LiveMapView 
        {...defaultProps} 
        participants={participantsWithNPC}
        mapState={mapStateWithNPC}
      />
    );
    
    expect(screen.getByText('npc1')).toBeInTheDocument();
    expect(screen.getByText('25/30 HP')).toBeInTheDocument();
  });

  it('handles conditions and status effects', () => {
    const participantsWithConditions = {
      ...mockParticipants,
      'player1': {
        ...mockParticipants.player1,
        conditions: [
          { id: '1', name: 'Poisoned', duration: 3, effects: {} },
          { id: '2', name: 'Haste', duration: 5, effects: {} },
        ],
      },
    };

    render(
      <LiveMapView 
        {...defaultProps} 
        participants={participantsWithConditions}
      />
    );
    
    // Hover over the player cell to see conditions
    const cell = screen.getByTestId('cell-2-2');
    fireEvent.mouseEnter(cell);
    
    expect(screen.getByText('Conditions: Poisoned, Haste')).toBeInTheDocument();
  });
});