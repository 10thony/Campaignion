import React from 'react';
import { render, screen } from '@testing-library/react';
import { TacticalMapView } from '../TacticalMapView';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Mock Convex client
const convex = new ConvexReactClient('http://localhost:8000');

// Mock the useQuery and useMutation hooks
jest.mock('convex/react', () => ({
  ...jest.requireActual('convex/react'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isSignedIn: true
  })
}));

describe('TacticalMapView', () => {
  const mockMapInstance = {
    _id: 'test-instance-id' as any,
    mapId: 'test-map-id' as any,
    name: 'Test Map Instance',
    currentPositions: [
      {
        entityId: 'player-1',
        entityType: 'playerCharacter' as const,
        x: 5,
        y: 5,
        speed: 30,
        name: 'Test Player',
        color: '#3b82f6'
      }
    ],
    movementHistory: [],
    createdBy: 'test-user-id' as any,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockMap = {
    _id: 'test-map-id' as any,
    name: 'Test Map',
    width: 20,
    height: 20,
    cells: Array.from({ length: 400 }, (_, i) => ({
      x: i % 20,
      y: Math.floor(i / 20),
      state: 'inbounds' as const,
      terrainType: 'normal' as const
    })),
    createdBy: 'test-user-id' as any,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    const { useQuery, useMutation } = require('convex/react');
    
    useQuery.mockImplementation((query: string) => {
      if (query.includes('getMapInstance')) {
        return mockMapInstance;
      }
      if (query.includes('getMap')) {
        return mockMap;
      }
      return null;
    });

    useMutation.mockImplementation(() => jest.fn());
  });

  it('renders loading state when data is not available', () => {
    const { useQuery } = require('convex/react');
    useQuery.mockReturnValue(undefined);

    render(
      <ConvexProvider client={convex}>
        <TacticalMapView instanceId="test-instance-id" as any />
      </ConvexProvider>
    );

    expect(screen.getByText('Loading tactical map...')).toBeInTheDocument();
  });

  it('renders the tactical map interface when data is available', () => {
    render(
      <ConvexProvider client={convex}>
        <TacticalMapView instanceId="test-instance-id" as any />
      </ConvexProvider>
    );

    // Check for toolbar
    expect(screen.getByText('Tactical Tools')).toBeInTheDocument();
    
    // Check for status panel
    expect(screen.getByText('Test Map Instance')).toBeInTheDocument();
    expect(screen.getByText('20 × 20')).toBeInTheDocument();
  });

  it('displays correct map information', () => {
    render(
      <ConvexProvider client={convex}>
        <TacticalMapView instanceId="test-instance-id" as any />
      </ConvexProvider>
    );

    expect(screen.getByText('Test Map Instance')).toBeInTheDocument();
    expect(screen.getByText('20 × 20')).toBeInTheDocument();
  });
}); 