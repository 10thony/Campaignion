import React, { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import './InteractionTemplates.css';

interface InteractionTemplatesProps {
  campaignId: Id<"campaigns">;
  onTemplateSelect?: (template: InteractionTemplate) => void;
}

interface InteractionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'social' | 'exploration' | 'puzzle' | 'custom';
  icon: string;
  color: string;
  participants: {
    playerCharacters: number;
    npcs: number;
    monsters: number;
  };
  suggestedLocations: string[];
  suggestedQuests: string[];
  rewardItems: string[];
  xpAwards: number;
  statusEffects: string[];
  customFields: Record<string, any>;
}

const defaultTemplates: InteractionTemplate[] = [
  {
    id: 'goblin-ambush',
    name: 'Goblin Ambush',
    description: 'A classic roadside ambush by goblin bandits. Perfect for low-level encounters.',
    category: 'combat',
    icon: '⚔️',
    color: '#ef4444',
    participants: {
      playerCharacters: 4,
      npcs: 0,
      monsters: 6
    },
    suggestedLocations: ['Roadside', 'Forest Path', 'Mountain Pass'],
    suggestedQuests: ['Clear the Roads', 'Protect the Caravan'],
    rewardItems: ['Shortsword', 'Leather Armor', 'Gold Coins'],
    xpAwards: 200,
    statusEffects: ['Poisoned', 'Frightened'],
    customFields: {
      terrain: 'forest',
      weather: 'clear',
      timeOfDay: 'day'
    }
  },
  {
    id: 'tavern-brawl',
    name: 'Tavern Brawl',
    description: 'A chaotic bar fight that can involve multiple factions and unexpected allies.',
    category: 'social',
    icon: '🍺',
    color: '#f59e0b',
    participants: {
      playerCharacters: 4,
      npcs: 8,
      monsters: 0
    },
    suggestedLocations: ['The Prancing Pony', 'Dragon\'s Breath Inn', 'Merchant\'s Rest'],
    suggestedQuests: ['Keep the Peace', 'Find the Informant'],
    rewardItems: ['Information', 'Reputation', 'Free Drinks'],
    xpAwards: 150,
    statusEffects: ['Intoxicated', 'Bruised'],
    customFields: {
      brawlType: 'friendly',
      stakes: 'reputation',
      bystanders: true
    }
  },
  {
    id: 'ancient-ruins',
    name: 'Ancient Ruins Exploration',
    description: 'Exploring mysterious ruins with traps, puzzles, and ancient guardians.',
    category: 'exploration',
    icon: '🏛️',
    color: '#8b5cf6',
    participants: {
      playerCharacters: 4,
      npcs: 2,
      monsters: 3
    },
    suggestedLocations: ['Forgotten Temple', 'Abandoned Fortress', 'Buried City'],
    suggestedQuests: ['Lost Artifacts', 'Ancient Knowledge'],
    rewardItems: ['Magic Scroll', 'Ancient Relic', 'Treasure Map'],
    xpAwards: 300,
    statusEffects: ['Cursed', 'Blessed', 'Trapped'],
    customFields: {
      ruinType: 'temple',
      age: 'ancient',
      hazards: ['traps', 'curses', 'guardians']
    }
  },
  {
    id: 'puzzle-chamber',
    name: 'Puzzle Chamber',
    description: 'A room filled with intricate puzzles that test the party\'s wits and teamwork.',
    category: 'puzzle',
    icon: '🧩',
    color: '#06b6d4',
    participants: {
      playerCharacters: 4,
      npcs: 0,
      monsters: 0
    },
    suggestedLocations: ['Wizard\'s Tower', 'Ancient Library', 'Secret Chamber'],
    suggestedQuests: ['Prove Your Worth', 'Unlock the Secrets'],
    rewardItems: ['Magic Item', 'Spell Scroll', 'Knowledge'],
    xpAwards: 250,
    statusEffects: ['Confused', 'Enlightened'],
    customFields: {
      puzzleType: 'logic',
      timeLimit: 30,
      hints: 3
    }
  },
  {
    id: 'merchant-negotiation',
    name: 'Merchant Negotiation',
    description: 'A tense negotiation with a shrewd merchant over valuable goods or information.',
    category: 'social',
    icon: '💰',
    color: '#10b981',
    participants: {
      playerCharacters: 2,
      npcs: 3,
      monsters: 0
    },
    suggestedLocations: ['Market Square', 'Merchant Guild', 'Trading Post'],
    suggestedQuests: ['Secure Supplies', 'Gather Intelligence'],
    rewardItems: ['Rare Goods', 'Information', 'Favors'],
    xpAwards: 100,
    statusEffects: ['Charmed', 'Suspicious'],
    customFields: {
      negotiationType: 'trade',
      stakes: 'high',
      timePressure: true
    }
  },
  {
    id: 'wilderness-survival',
    name: 'Wilderness Survival',
    description: 'A challenging journey through dangerous wilderness with environmental hazards.',
    category: 'exploration',
    icon: '🌲',
    color: '#059669',
    participants: {
      playerCharacters: 4,
      npcs: 1,
      monsters: 2
    },
    suggestedLocations: ['Dense Forest', 'Frozen Mountains', 'Desert Wastes'],
    suggestedQuests: ['Reach the Summit', 'Cross the Desert'],
    rewardItems: ['Survival Gear', 'Rare Materials', 'Map Knowledge'],
    xpAwards: 200,
    statusEffects: ['Exhausted', 'Frostbitten', 'Dehydrated'],
    customFields: {
      environment: 'forest',
      weather: 'stormy',
      resources: 'scarce'
    }
  }
];

export const InteractionTemplates: React.FC<InteractionTemplatesProps> = ({
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<InteractionTemplate[]>(defaultTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<Partial<InteractionTemplate>>({});

  // Queries


  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'combat', name: 'Combat', icon: '⚔️' },
    { id: 'social', name: 'Social', icon: '💬' },
    { id: 'exploration', name: 'Exploration', icon: '🗺️' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'custom', name: 'Custom', icon: '✨' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: InteractionTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCreateTemplate = () => {
    if (customTemplate.name && customTemplate.description) {
      const newTemplate: InteractionTemplate = {
        id: `custom-${Date.now()}`,
        name: customTemplate.name,
        description: customTemplate.description,
        category: customTemplate.category || 'custom',
        icon: customTemplate.icon || '✨',
        color: customTemplate.color || '#6366f1',
        participants: customTemplate.participants || { playerCharacters: 4, npcs: 0, monsters: 0 },
        suggestedLocations: customTemplate.suggestedLocations || [],
        suggestedQuests: customTemplate.suggestedQuests || [],
        rewardItems: customTemplate.rewardItems || [],
        xpAwards: customTemplate.xpAwards || 100,
        statusEffects: customTemplate.statusEffects || [],
        customFields: customTemplate.customFields || {}
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setCustomTemplate({});
      setShowCreateForm(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat': return '#ef4444';
      case 'social': return '#f59e0b';
      case 'exploration': return '#8b5cf6';
      case 'puzzle': return '#06b6d4';
      case 'custom': return '#6366f1';
      default: return '#6b7280';
    }
  };

  return (
    <div className="interaction-templates">
      <div className="templates-header">
        <h3>📋 Interaction Templates</h3>
        <div className="header-controls">
          <button
            className="btn-create"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '❌ Cancel' : '➕ Create Template'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="templates-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                borderColor: selectedCategory === category.id ? getCategoryColor(category.id) : 'transparent'
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="create-template-form">
          <h4>Create New Template</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                value={customTemplate.name || ''}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Dragon Lair Assault"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={customTemplate.description || ''}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the interaction scenario..."
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={customTemplate.category || 'custom'}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                className="form-select"
              >
                <option value="combat">⚔️ Combat</option>
                <option value="social">💬 Social</option>
                <option value="exploration">🗺️ Exploration</option>
                <option value="puzzle">🧩 Puzzle</option>
                <option value="custom">✨ Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Icon</label>
              <input
                type="text"
                value={customTemplate.icon || '✨'}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🎲"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>XP Awards</label>
              <input
                type="number"
                value={customTemplate.xpAwards || 100}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, xpAwards: parseInt(e.target.value) || 0 }))}
                className="form-input"
                min="0"
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              className="btn-save"
              onClick={handleCreateTemplate}
              disabled={!customTemplate.name || !customTemplate.description}
            >
              💾 Save Template
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="template-card"
            style={{ borderLeftColor: template.color }}
          >
            <div className="template-header">
              <div className="template-icon" style={{ backgroundColor: template.color }}>
                {template.icon}
              </div>
              <div className="template-info">
                <h4 className="template-name">{template.name}</h4>
                <span className="template-category">
                  {categories.find(c => c.id === template.category)?.name}
                </span>
              </div>
              {template.category === 'custom' && (
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteTemplate(template.id)}
                  title="Delete template"
                >
                  🗑️
                </button>
              )}
            </div>

            <p className="template-description">{template.description}</p>

            <div className="template-details">
              <div className="participants">
                <span className="detail-label">Participants:</span>
                <div className="participant-counts">
                  {template.participants.playerCharacters > 0 && (
                    <span className="count pc">👤 {template.participants.playerCharacters}</span>
                  )}
                  {template.participants.npcs > 0 && (
                    <span className="count npc">🧙 {template.participants.npcs}</span>
                  )}
                  {template.participants.monsters > 0 && (
                    <span className="count monster">🐉 {template.participants.monsters}</span>
                  )}
                </div>
              </div>

              <div className="rewards">
                <span className="detail-label">Rewards:</span>
                <div className="reward-items">
                  <span className="xp">⭐ {template.xpAwards} XP</span>
                  {template.rewardItems.length > 0 && (
                    <span className="items">📦 {template.rewardItems.length} items</span>
                  )}
                </div>
              </div>

              {template.statusEffects.length > 0 && (
                <div className="status-effects">
                  <span className="detail-label">Status Effects:</span>
                  <div className="effects-list">
                    {template.statusEffects.map((effect, index) => (
                      <span key={index} className="effect-tag">{effect}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="template-actions">
              <button
                className="btn-use-template"
                onClick={() => handleTemplateSelect(template)}
              >
                🚀 Use Template
              </button>
              <button
                className="btn-preview"
                onClick={() => {/* TODO: Add preview functionality */}}
              >
                👁️ Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="no-templates">
          <div className="no-templates-icon">📋</div>
          <h4>No templates found</h4>
          <p>Try adjusting your search or create a new template.</p>
        </div>
      )}
    </div>
  );
}; 