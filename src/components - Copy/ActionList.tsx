import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PlayerCharacterAction } from '../types/dndRules';
import Action from './Action';
import { Button } from './ui/button';

interface ActionListProps {
  actions: PlayerCharacterAction[];
}

const ActionList: React.FC<ActionListProps> = ({ actions }) => {
  const [filter, setFilter] = useState<string>('all');
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const { user } = useUser();
  const userRole = useQuery(api.users.getUserRole, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const loadSampleActions = useMutation(api.actions.loadSampleActionsFromJson);

  const filteredActions = actions.filter(action => {
    if (filter === 'all') return true;
    return action.type === filter;
  });

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'MELEE_ATTACK', label: 'Melee Attacks' },
    { value: 'RANGED_ATTACK', label: 'Ranged Attacks' },
    { value: 'SPELL', label: 'Spells' },
    { value: 'CLASS_FEATURE', label: 'Class Features' },
    { value: 'COMMONLY_AVAILABLE_UTILITY', label: 'Utility' },
  ];

  const handleLoadSampleData = async () => {
    if (!user?.id) {
      alert('Please sign in to load sample data');
      return;
    }

    setIsLoadingSample(true);
    try {
      await loadSampleActions({ clerkId: user.id });
      alert('Sample actions loaded successfully! Please refresh the page to see them.');
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert(`Failed to load sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {actionTypes.map(type => (
          <Button
            key={type.value}
            onClick={() => setFilter(type.value)}
            variant={filter === type.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
          >
            {type.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredActions.map(action => (
          <Action key={action.id} action={action} />
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            No actions found for the selected filter.
          </div>
          {userRole === 'admin' && (
            <Button
              onClick={handleLoadSampleData}
              disabled={isLoadingSample}
              className="px-6 py-3"
            >
              {isLoadingSample ? 'Loading Sample Data...' : 'Load Sample Actions Data'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionList; 