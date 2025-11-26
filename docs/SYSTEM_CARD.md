# Campaignion System Card

**Version:** 0.0.0  
**Last Updated:** 2024  
**Project Type:** Full-Stack D&D 5e Campaign Management Platform

---

## Executive Summary

Campaignion is a comprehensive Dungeons & Dragons 5th Edition campaign management platform built as a modern, real-time web application. It provides tools for Dungeon Masters and players to manage campaigns, characters, combat encounters, quests, locations, and live interactive sessions with real-time synchronization.

---

## Technology Stack

### Frontend Framework & Core
- **React 18.2.0** - UI library with modern hooks and concurrent features
- **TypeScript 5.2.2** - Type-safe development with strict mode enabled
- **Vite 5.0.8** - Fast build tool and development server
- **ES Modules** - Modern JavaScript module system

### Routing & Navigation
- **TanStack Router 1.130.12** - Type-safe file-based routing with code splitting
- **TanStack Router DevTools** - Development-time routing debugging

### State Management
- **Zustand 5.0.8** - Lightweight state management for UI state
- **Immer 10.1.3** - Immutable state updates with mutable syntax
- **TanStack React Query 5.12.2** - Server state management and caching
- **Convex React Hooks** - Real-time reactive data subscriptions

### Backend & Database
- **Convex 1.29.3** - Serverless backend with real-time database
  - Type-safe queries, mutations, and actions
  - Automatic real-time subscriptions
  - Built-in authentication integration
- **Convex Test 0.0.38** - Testing utilities for Convex functions

### Authentication & Authorization
- **Clerk 5.37.0** - Complete authentication solution
  - User management
  - Session handling
  - Role-based access control (admin/user)
- **Convex-Clerk Integration** - Seamless auth state synchronization

### UI Component Library
- **Radix UI** - Headless, accessible component primitives
  - Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
  - Icons, Label, Popover, Progress, Select, Separator
  - Slider, Switch, Slot, Tabs, Toast
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Tailwind Animate** - Animation utilities
- **Class Variance Authority** - Component variant management
- **Lucide React** - Icon library
- **Sonner** - Toast notification system

### Form Management & Validation
- **React Hook Form 7.48.2** - Performant form library
- **Zod 3.22.4** - Schema validation
- **Hookform Resolvers** - Zod integration for React Hook Form

### Data Processing & Utilities
- **SuperJSON 2.2.2** - Enhanced JSON serialization
- **PDF.js 5.4.54** - PDF parsing for character sheet import
- **Tesseract.js 5.0.4** - OCR capabilities (for scanned PDFs)
- **PDF2Pic 3.2.0** - PDF to image conversion

### Real-Time Features
- **Convex Real-time Subscriptions** - Automatic data synchronization
- **Live Interaction System** - Custom real-time game state management
- **WebSocket Support** - For live session coordination

### Drag & Drop
- **React DnD 16.0.1** - Drag and drop functionality
- **React DnD HTML5 Backend** - HTML5 drag and drop implementation

### Data Tables
- **TanStack Table 8.11.2** - Headless table component library

### AI Integration
- **OpenAI 6.3.0** - GPT integration for content generation

### Development Tools
- **Bun** - Fast all-in-one JavaScript runtime and package manager
- **ESLint** - Code linting with TypeScript support
- **TypeScript ESLint** - TypeScript-specific linting rules

### Testing
- **Vitest 3.2.4** - Fast unit test runner
- **Testing Library React 16.3.0** - React component testing
- **Testing Library User Event** - User interaction simulation
- **Testing Library Jest DOM** - DOM matchers for Jest/Vitest
- **MSW 2.10.4** - API mocking for tests
- **MSW tRPC** - tRPC mocking utilities
- **Jest Axe** - Accessibility testing
- **JSDOM** - DOM environment for testing

### Build & Deployment
- **Node.js 20+** - Runtime environment (fallback)
- **Bun 1.0+** - Primary package manager and runtime
- **Netlify** - Hosting and CI/CD
- **TypeScript Compiler** - Type checking before builds

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React UI   │  │ TanStack     │  │   Zustand    │       │
│  │  Components  │  │   Router     │  │   State      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ React Query  │  │   Convex     │  │    Clerk     │       │
│  │   Cache      │  │   Hooks      │  │   Auth       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Convex Backend                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Queries  │  │ Mutations│  │ Actions  │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘            │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │         Real-time Database                    │   │   │
│  │  │  (Automatic subscriptions & sync)             │   │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Clerk Authentication                    │   │
│  │  (User management, sessions, RBAC)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Application Structure

```
Campaignion/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI primitives (Radix-based)
│   │   ├── modals/        # Modal dialogs
│   │   ├── maps/          # Battle map components
│   │   ├── characterImport/ # PDF import system
│   │   └── ...
│   ├── pages/             # Route page components
│   ├── lib/               # Utility libraries
│   │   ├── convex.ts     # Convex client setup
│   │   ├── clerkService.ts # Clerk integration
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── router.ts          # TanStack Router configuration
│   ├── App.tsx            # Root layout component
│   └── main.tsx           # Application entry point
│
├── convex/                 # Backend (Convex functions)
│   ├── schema.ts          # Database schema definition
│   ├── characters.ts      # Character CRUD operations
│   ├── campaigns.ts       # Campaign management
│   ├── liveSystem.ts      # Real-time interaction system
│   ├── actions.ts         # Server actions
│   └── ...
│
├── shared-types/          # Shared TypeScript types
│   └── src/
│       ├── types/         # Type definitions
│       └── schemas/       # Zod validation schemas
│
├── public/                # Static assets
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

---

## Implementation Styles & Patterns

### Component Architecture

#### 1. **Component Composition Pattern**
- Heavy use of Radix UI primitives for accessibility
- Compound components for complex UI (e.g., Dialog, Dropdown)
- Composition over configuration

```typescript
// Example: Modal composition
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### 2. **Custom Hooks Pattern**
- Business logic extracted into reusable hooks
- Separation of concerns: UI vs. logic
- Examples: `useLiveInteraction`, `useBattleMap`, `useCharacterImport`

#### 3. **State Management Strategy**
- **Zustand** for client-side UI state (battle maps, UI toggles)
- **Convex Hooks** for server state (automatic real-time sync)
- **React Query** for additional caching and background updates
- **Immer** for immutable updates with mutable syntax

#### 4. **Type Safety First**
- Strict TypeScript configuration
- Shared types between frontend and backend via `shared-types` package
- Zod schemas for runtime validation
- Convex-generated types for database queries

### Data Flow Patterns

#### 1. **Real-Time Data Flow**
```
User Action → React Component → Convex Mutation
                                      ↓
                            Database Update
                                      ↓
                    Convex Real-time Subscription
                                      ↓
                            React Component Re-render
```

#### 2. **Form Handling Pattern**
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
})

// Submit handler
const onSubmit = async (data: FormData) => {
  await mutate({ ...data })
}
```

#### 3. **Error Handling**
- Error boundaries for component-level errors
- Try-catch in async operations
- User-friendly error messages via toast notifications
- Validation errors displayed inline in forms

### Code Organization Principles

1. **Feature-Based Structure**
   - Components grouped by feature (e.g., `characterImport/`, `maps/`)
   - Related utilities co-located with features

2. **Shared Utilities**
   - Common utilities in `src/lib/`
   - Type definitions in `src/types/` or `shared-types/`
   - Reusable UI components in `src/components/ui/`

3. **Separation of Concerns**
   - UI components: Presentation only
   - Hooks: Business logic and state
   - Convex functions: Data operations and validation
   - Types: Shared across layers

### Styling Approach

1. **Tailwind CSS Utility Classes**
   - Utility-first styling
   - Custom theme configuration with CSS variables
   - Dark mode support via class-based toggling

2. **Component Variants**
   - Class Variance Authority for component variants
   - Consistent design system via Tailwind config

3. **Responsive Design**
   - Mobile-first approach
   - Breakpoint-based layouts
   - Collapsible sidebar for mobile

---

## Key Features & Modules

### 1. Character Management
- **Character Creation**: Manual entry with D&D 5e rules validation
- **PDF Import**: Geometry-aware PDF parsing for character sheets
- **Multiclass Support**: Multiple classes per character
- **Equipment Management**: Inventory and equipped items tracking
- **Ability Score Calculation**: Automatic modifier calculation
- **Spellcasting**: Spell slots, known spells, spell attack bonuses

**Implementation Details:**
- PDF parsing uses PDF.js with geometry-aware text extraction
- Confidence scoring for parsed data
- Server-side import with authentication and deduplication
- Inline editing with confidence indicators

### 2. Campaign Management
- Campaign creation and organization
- Player invitation system with join requests
- Campaign-specific resources (quests, locations, NPCs)
- Timeline event tracking
- Session management with XP and loot tracking

### 3. Battle Map System
- **Grid-based Maps**: Customizable grid with terrain types
- **Token Management**: Drag-and-drop token placement
- **Initiative System**: Turn order management
- **Combat Tracking**: Action history, damage, status effects
- **Terrain Effects**: Movement costs, damage zones, ability checks
- **Map Instances**: Multiple active map instances per campaign

**Technical Implementation:**
- Zustand store for map state (`battleMapStore.ts`)
- Real-time synchronization via Convex
- Undo/redo via state snapshots
- Multi-select and area-of-effect templates

### 4. Live Interaction System
- **Real-Time Sessions**: WebSocket-based live game sessions
- **Turn Management**: Initiative-based turn order
- **Chat System**: Party, DM, private, and system messages
- **Game State Engine**: Centralized state management for interactions
- **Participant Tracking**: Connection status, activity monitoring
- **Action Processing**: Validated action execution with dice rolling

**Architecture:**
- `liveRooms` table for session state
- `liveChatMessages` for communication
- `liveGameEvents` for event logging
- `liveTurnActions` for action tracking
- `liveParticipantStates` for real-time participant data

### 5. Quest & Task Management
- Hierarchical quest structure with tasks
- Task dependencies and prerequisites
- Status tracking (idle, in_progress, completed, failed)
- Reward system (XP, gold, items)
- Quest-location-character relationships

### 6. Item & Equipment System
- Item creation with D&D 5e item types
- Rarity system (Common to Artifact)
- Equipment slots (headgear, armwear, chestwear, etc.)
- Equipment bonuses (AC, ability scores)
- Durability tracking
- Attunement support

### 7. Monster Management
- Monster stat block creation
- Challenge Rating (CR) and XP calculation
- Action, reaction, legendary action support
- Monster cloning for encounter instances
- Inventory and equipment for monsters

### 8. Location Management
- Location types (Town, City, Dungeon, etc.)
- Linked locations (travel routes)
- Location-specific interactions
- Map associations
- Notable characters at locations

### 9. Action System
- D&D 5e action types (Melee Attack, Ranged Attack, Spell, etc.)
- Action costs (Action, Bonus Action, Reaction)
- Damage rolls with dice types and modifiers
- Class-specific actions
- Level requirements and prerequisites

### 10. Game Constants Management
- Admin-configurable D&D 5e constants
- Categories: damage types, dice types, action costs, item types
- Sortable, filterable constants
- Metadata support (icons, colors, descriptions)

---

## Database Schema (Convex)

### Core Tables

1. **users** - User accounts (linked to Clerk)
2. **characters** - Player characters and NPCs
3. **campaigns** - Campaign instances
4. **quests** - Quest definitions
5. **questTasks** - Individual quest tasks
6. **items** - Equipment and consumables
7. **actions** - D&D actions and abilities
8. **monsters** - Monster stat blocks
9. **locations** - World locations
10. **maps** - Battle and non-combat maps
11. **interactions** - Combat and social encounters
12. **timelineEvents** - Campaign timeline entries
13. **factions** - Faction definitions and relationships

### Live System Tables

1. **liveRooms** - Active interaction sessions
2. **liveChatMessages** - Real-time chat messages
3. **liveGameEvents** - Game event log
4. **liveTurnActions** - Turn action records
5. **liveParticipantStates** - Real-time participant data
6. **liveSystemLogs** - System debugging logs

### Battle Map Tables

1. **battleMaps** - Map definitions
2. **battleTokens** - Token placements
3. **battleMapInstances** - Active map instances
4. **mapInstances** - Legacy map instance system

### Game Constants Tables

1. **gameConstants** - General game constants
2. **dndClasses** - D&D class definitions
3. **abilityScores** - Ability score metadata
4. **actionCosts** - Action cost types
5. **actionTypes** - Action type definitions
6. **damageTypes** - Damage type definitions
7. **diceTypes** - Dice type definitions
8. **itemTypes** - Item type definitions
9. **itemRarities** - Item rarity definitions
10. **armorCategories** - Armor category definitions
11. **spellLevels** - Spell level definitions
12. **restTypes** - Rest type definitions
13. **terrainTypes** - Terrain type definitions

### Schema Features

- **Type Safety**: All tables defined with Convex validators (`v.*`)
- **Indexes**: Strategic indexes for query performance
- **Relationships**: Foreign key references via `v.id("tableName")`
- **Optional Fields**: Backward compatibility with optional fields
- **Metadata**: Created/updated timestamps on most tables

---

## Development Workflow

### Local Development

1. **Prerequisites**
   - Bun 1.0+ (primary)
   - Node.js 20+ (fallback)
   - Convex account and project
   - Clerk account and application

2. **Environment Setup**
   ```bash
   # Install dependencies
   bun install
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your keys
   ```

3. **Development Commands**
   ```bash
   # Run frontend and Convex dev server concurrently
   bun run dev
   
   # Run only frontend
   bun run dev:frontend
   
   # Run only Convex
   bun run dev:convex
   ```

4. **Type Generation**
   - Convex types auto-generate on `convex dev`
   - Shared types build: `cd shared-types && bun run build`

### Testing

1. **Unit Tests**
   ```bash
   bun test              # Run once
   bun run test:watch    # Watch mode
   ```

2. **Integration Tests**
   ```bash
   bun run test:integration
   bun run test:integration:watch
   ```

3. **E2E Tests**
   ```bash
   bun run test:e2e
   ```

4. **Test Configuration**
   - Vitest for test runner
   - JSDOM for DOM environment
   - MSW for API mocking
   - Testing Library for component testing

### Code Quality

1. **Linting**
   ```bash
   bun run lint
   ```

2. **Type Checking**
   ```bash
   tsc --noEmit
   ```

3. **Build Verification**
   ```bash
   bun run build
   ```

### Deployment

1. **Netlify Deployment**
   - Automatic deployment on git push
   - Build command: `bun install && bun run build:skip-check`
   - Publish directory: `dist`
   - Bun version: 1.1.0+

2. **Environment Variables** (Set in Netlify UI)
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_CONVEX_URL`

3. **Convex Deployment**
   ```bash
   bunx convex deploy
   ```

4. **Build Process**
   - TypeScript compilation
   - Vite build (production optimizations)
   - Asset optimization
   - Code splitting

---

## Security & Authentication

### Authentication Flow

1. **Clerk Authentication**
   - User signs in via Clerk
   - Clerk provides JWT tokens
   - Frontend stores session

2. **Convex Integration**
   - Convex validates Clerk tokens
   - User data synced to Convex `users` table
   - Role-based access control (admin/user)

3. **Authorization**
   - Queries/mutations check user authentication
   - Campaign-level permissions
   - Admin-only operations protected

### Security Practices

1. **Environment Variables**
   - Sensitive keys in environment variables
   - No secrets in client code
   - Vite prefix (`VITE_*`) for public variables only

2. **Input Validation**
   - Zod schemas for all user inputs
   - Convex validators for database writes
   - Type checking at compile time

3. **Error Handling**
   - No sensitive data in error messages
   - User-friendly error messages
   - Detailed errors in development only

---

## Performance Optimizations

1. **Code Splitting**
   - Route-based code splitting via TanStack Router
   - Lazy loading of heavy components

2. **Caching**
   - React Query for server state caching
   - Convex automatic query caching
   - Stale-while-revalidate pattern

3. **Real-Time Efficiency**
   - Selective subscriptions (only needed data)
   - Optimistic updates where appropriate
   - Debounced inputs for search/filter

4. **Asset Optimization**
   - Vite production builds with minification
   - Tree shaking for unused code
   - Image optimization (if implemented)

5. **PDF Processing**
   - Client-side PDF parsing (reduces server load)
   - Optional server-side import for large files
   - Worker threads for heavy processing

---

## Accessibility

1. **Radix UI Components**
   - Built-in ARIA attributes
   - Keyboard navigation support
   - Screen reader compatibility

2. **Semantic HTML**
   - Proper heading hierarchy
   - Form labels and associations
   - Landmark regions

3. **Testing**
   - Jest Axe for accessibility testing
   - Manual keyboard navigation testing

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **PDF Import**
   - Best results with fillable PDFs
   - Scanned PDFs require OCR (Tesseract.js)
   - Some complex layouts may not parse perfectly

2. **Real-Time System**
   - WebSocket connections may need reconnection handling
   - Large game states may impact performance

3. **Mobile Experience**
   - Battle map interaction optimized for desktop
   - Some features may be limited on mobile

### Future Enhancements

1. **Enhanced PDF Import**
   - Machine learning for better parsing
   - Support for more character sheet formats

2. **Advanced Combat System**
   - Automated damage calculation
   - Status effect automation
   - Condition tracking

3. **Content Generation**
   - AI-powered quest generation
   - NPC personality generation
   - Location descriptions

4. **Collaboration Features**
   - Real-time collaborative editing
   - Shared notes and journals
   - Voice/video integration

---

## Dependencies Summary

### Production Dependencies (Key)
- React ecosystem: React, React DOM, React Router (TanStack)
- State: Zustand, React Query, Convex
- UI: Radix UI, Tailwind CSS, Lucide Icons
- Forms: React Hook Form, Zod
- Auth: Clerk
- PDF: PDF.js, Tesseract.js
- Utils: Immer, SuperJSON, clsx, tailwind-merge

### Development Dependencies (Key)
- Build: Vite, TypeScript, ESLint
- Testing: Vitest, Testing Library, MSW
- Dev Tools: TanStack Router DevTools

---

## Contact & Resources

- **Project Repository**: [GitHub/Repository]
- **Documentation**: `/docs` directory
- **Deployment**: Netlify
- **Backend**: Convex Cloud

---

## Version History

- **0.0.0** - Initial system card documentation
  - Comprehensive architecture documentation
  - Tech stack inventory
  - Implementation patterns documented

---

*This system card is a living document and should be updated as the system evolves.*


