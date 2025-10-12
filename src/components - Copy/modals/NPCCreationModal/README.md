# Character Creation Modal

The CharacterCreationModal (formerly NPCCreationModal) has been enhanced to support both NPC and PlayerCharacter creation, as well as read-only display mode.

## Features

- **Dual Character Type Support**: Create both NPCs and Player Characters
- **Read-Only Mode**: Display character data without editing capabilities
- **Backward Compatibility**: Legacy NPCCreationModal still works
- **Comprehensive Form**: Six tabs covering all character aspects
- **Validation**: Built-in form validation with error display
- **Responsive Design**: Works on desktop and mobile devices

## Usage

### Basic NPC Creation (Legacy)

```tsx
import { NPCCreationModal } from "./modals/NPCCreationModal";

<NPCCreationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(npcId) => console.log("NPC created:", npcId)}
/>
```

### Player Character Creation

```tsx
import CharacterCreationModal from "./modals/NPCCreationModal";

<CharacterCreationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(characterId) => console.log("Character created:", characterId)}
  characterType="PlayerCharacter"
  title="Create New Player Character"
  description="Create a new player character for your campaign"
/>
```

### Read-Only Character View

```tsx
import CharacterCreationModal from "./modals/NPCCreationModal";

<CharacterCreationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={() => {}} // Not used in read-only mode
  characterType="NonPlayerCharacter"
  isReadOnly={true}
  initialData={characterData}
  title="Character Details"
  description="View detailed information about this character"
/>
```

## Props

### CharacterCreationModalProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility |
| `onClose` | `() => void` | - | Called when modal is closed |
| `onSuccess` | `(characterId: Id<"npcs"> \| Id<"playerCharacters">) => void` | - | Called when character is created successfully |
| `characterType` | `"PlayerCharacter" \| "NonPlayerCharacter"` | `"NonPlayerCharacter"` | Type of character to create |
| `isReadOnly` | `boolean` | `false` | If true, displays data in read-only mode |
| `initialData` | `Partial<CharacterFormData>` | - | Data to populate form (used in read-only mode) |
| `title` | `string` | - | Custom modal title |
| `description` | `string` | - | Custom modal description |

### CharacterFormData

```tsx
interface CharacterFormData {
  name: string;
  race: string;
  class: string;
  background: string;
  alignment: string;
  level: number;
  hitPoints: number;
  armorClass: number;
  proficiencyBonus: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: string[];
  savingThrows: string[];
  proficiencies: string[];
  traits: string[];
  languages: string[];
  equipment: string[];
  description: string;
}
```

## Form Tabs

### 1. Basic Info
- Name, Race, Class, Background, Alignment
- Level and Proficiency Bonus
- Supports read-only display

### 2. Stats & Combat
- Hit Points and Armor Class
- Combat guidelines (hidden in read-only mode)
- Supports read-only display

### 3. Ability Scores
- All six D&D ability scores (1-30 range)
- Automatic modifier calculation
- Visual modifier indicators
- Supports read-only display

### 4. Skills & Proficiencies
- Skill proficiencies
- Saving throw proficiencies
- Weapon/armor/tool proficiencies
- Tag-based display in read-only mode

### 5. Traits & Equipment
- Character traits and special abilities
- Languages known
- Equipment and items
- Tag-based display in read-only mode

### 6. Description
- Character description and background
- Guidelines for writing descriptions (hidden in read-only mode)
- Supports read-only display with preserved formatting

## API Integration

The modal automatically uses the appropriate API based on the character type:

- **NPCs**: Uses `api.npcs.createNpc`
- **Player Characters**: Uses `api.characters.createPlayerCharacter`

## Styling

The modal uses Tailwind CSS classes and integrates with the existing design system:

- **Read-only fields**: Gray background with muted text
- **Array fields**: Display as tags in read-only mode
- **Ability scores**: Color-coded modifiers
- **Responsive grid**: Adapts to different screen sizes

## Migration Guide

### From NPCCreationModal

The legacy `NPCCreationModal` still works exactly as before:

```tsx
// Old usage still works
<NPCCreationModal
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={onSuccess}
/>
```

### To CharacterCreationModal

For new features, use the new `CharacterCreationModal`:

```tsx
// New usage with additional features
<CharacterCreationModal
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={onSuccess}
  characterType="PlayerCharacter" // or "NonPlayerCharacter"
  isReadOnly={false}
  // ... other props
/>
```

## Example Component

See `CharacterCreationModalExample.tsx` for complete usage examples including:
- NPC creation
- Player character creation
- Read-only character viewing 