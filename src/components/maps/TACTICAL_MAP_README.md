# The Archmage's Atlas - Tactical Map System

## Overview

The Archmage's Atlas is a next-generation tactical map interface designed specifically for D&D 5e gameplay. It provides a fast, fluid, and intuitive experience that feels like an enchanted, intelligent game board rather than clunky software.

## Core Philosophy

- **Performance is Paramount**: Interactions feel instantaneous with optimistic updates and local state management
- **Clarity Over Clutter**: Clean UI that provides information contextually
- **Responsive & Accessible**: Usable on any device from large monitors to tablets
- **Rules-Aware**: Understands D&D 5e mechanics like movement, range, and terrain

## Architecture

### Component Structure

```
TacticalMapView.tsx     # Main container, manages local state and Convex mutations
├── MapToolbar.tsx      # UI for switching between interaction tools
├── MapGrid.tsx         # Interactive grid with pan/zoom functionality
├── MapCell.tsx         # Individual grid cells with terrain and visual effects
└── MapToken.tsx        # Entity tokens with selection and type indicators
```

### Data Flow

1. **MapModal** → **MapTab** → User selects a map instance
2. **TacticalMapView** receives the `instanceId` and fetches data via Convex queries
3. User interactions are handled locally within **TacticalMapView** and children
4. Confirmed actions trigger Convex mutations, changes propagate to all clients

## Features

### Phase 1: MVP - The Tactical Core ✅

- **Grid & Token Rendering**: Visual grid with entity tokens based on map data
- **Responsive Pan & Zoom**: Robust navigation for all screen sizes
- **Token Selection & Movement**: Select tokens and move them with range visualization
- **DM Override**: DMs can move any token without restriction

### Phase 2: DM & Player Empowerment Tools 🚧

- **Map Toolbar**: Central UI for switching interaction modes
- **Measure Distance Tool**: Point-to-point distance measurement with 5e diagonal rules
- **Area of Effect Templates**: Visual aids for spell shapes (sphere, cube, cone, line)
- **DM Terrain Painter**: Dynamic terrain modification for DMs

### Phase 3: Advanced Integration & Polish 📋

- **Contextual Info Panels**: Hover/click pop-ups with detailed information
- **Rules-Aware Targeting**: Automatic highlighting of valid targets in range
- **Animations & Effects**: Subtle animations for movement and actions

## Tools & Interaction Modes

### Select Tool
- **Purpose**: Select tokens and view information
- **Controls**: Left click to select tokens
- **Visual Feedback**: Selected tokens show blue ring and scale up

### Move Tool
- **Purpose**: Move selected tokens
- **Controls**: Hover to preview movement, click to confirm
- **Visual Feedback**: Movement range highlighted, path preview shown

### Measure Tool
- **Purpose**: Measure distances between points
- **Controls**: Click two points to measure
- **Visual Feedback**: Yellow rings on measure points, distance displayed

### Area of Effect Tool
- **Purpose**: Place spell templates
- **Controls**: Click to place AoE template
- **Visual Feedback**: Red overlay on affected cells

### Terrain Tool (DM Only)
- **Purpose**: Paint terrain types
- **Controls**: Click to apply terrain type
- **Visual Feedback**: Terrain color changes immediately

### Info Tool
- **Purpose**: View detailed information
- **Controls**: Hover/click for info panels
- **Visual Feedback**: Contextual information display

## Technical Implementation

### Local State Management

```typescript
interface LocalMapState {
  selectedTokenId: string | null;
  hoveredCell: { x: number; y: number } | null;
  movementPreview: {
    path: Array<{ x: number; y: number }>;
    cost: number;
    valid: boolean;
  } | null;
  measurePoints: Array<{ x: number; y: number }> | null;
  aoeTemplate: {
    type: 'sphere' | 'cube' | 'cone' | 'line';
    size: number;
    center: { x: number; y: number };
    direction?: number;
  } | null;
  terrainBrush: {
    type: 'normal' | 'difficult' | 'hazardous' | 'water' | 'magical';
    active: boolean;
  };
}
```

### Performance Optimizations

- **React.memo**: Used on MapCell and MapToken components
- **Local State First**: In-progress actions handled locally
- **Optimistic Updates**: Immediate visual feedback
- **Minimal Re-renders**: Efficient state management

### D&D 5e Rules Integration

- **Diagonal Movement**: 5ft/10ft alternating cost calculation
- **Terrain Costs**: Difficult terrain costs 2 feet per 1 foot traveled
- **Movement Speed**: Based on character speed in feet
- **Spell Templates**: Standard D&D 5e area shapes

## Usage Examples

### Basic Token Movement

```tsx
// Select a token
<TacticalMapView instanceId="map-instance-id" />

// Switch to move tool and hover over destination
// Click to confirm movement
```

### Distance Measurement

```tsx
// Switch to measure tool
// Click two points on the map
// Distance displayed in status panel
```

### Terrain Painting (DM)

```tsx
// Switch to terrain tool
// Select terrain type (difficult, hazardous, etc.)
// Click cells to apply terrain
```

## API Reference

### TacticalMapView Props

```typescript
interface TacticalMapViewProps {
  instanceId: Id<"mapInstances">;
  className?: string;
}
```

### MapTool Types

```typescript
type MapTool = 'select' | 'move' | 'measure' | 'aoe' | 'terrain' | 'info';
```

### Convex Mutations Used

- `api.maps.moveEntity`: Move tokens on the map
- `api.maps.updateMapCells`: Update terrain types

### Convex Queries Used

- `api.maps.getMapInstance`: Get map instance data
- `api.maps.getMap`: Get base map data

## Future Enhancements

### Pathfinding
- Implement A* pathfinding for complex movement
- Consider terrain costs in path calculation
- Show multiple path options

### Advanced AoE
- Line of sight calculations
- Cover mechanics
- Spell targeting validation

### Turn Management
- Integration with initiative system
- Turn-based movement restrictions
- Action point tracking

### Visual Enhancements
- Token animations
- Spell effect animations
- Weather/lighting effects

## Testing

Run the test suite:

```bash
bun test src/components/maps/__tests__/TacticalMapView.test.tsx
```

## Demo

Use the `TacticalMapDemo` component to see the system in action:

```tsx
import { TacticalMapDemo } from './components/maps';

// In your app
<TacticalMapDemo />
```

## Contributing

When adding new features:

1. Follow the local-state-first approach
2. Maintain D&D 5e rules compliance
3. Ensure responsive design
4. Add comprehensive tests
5. Update this documentation

## Performance Guidelines

- Keep local state updates fast and synchronous
- Use React.memo for expensive components
- Minimize Convex calls during gameplay
- Optimize for 60fps interactions
- Test on mobile devices 