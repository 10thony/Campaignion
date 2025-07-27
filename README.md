# Campaignion - D&D 5e Campaign Manager

A comprehensive D&D 5e campaign management web application built with React, TypeScript, TanStack, Convex, and Clerk.

## Features

- **Campaign Management**: Create and manage D&D campaigns with role-based access
- **Character & NPC Management**: Full D&D 5e character sheets with stat calculations
- **Monster Management**: Complete monster database with CR, legendary actions, and combat stats
- **Quest & Task Tracking**: Organize quests with dependencies and progress tracking
- **Location & Map Management**: Interactive maps and location databases
- **Authentication & Authorization**: Secure user management with campaign-specific roles
- **Real-time Collaboration**: Live updates for all campaign participants
- **D&D 5e Compliance**: Official D&D 5e rules and calculations throughout

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex (database + server functions)
- **Authentication**: Clerk
- **UI Components**: ShadCN/UI + Radix UI
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query
- **Tables**: TanStack Table
- **Routing**: TanStack Router

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campaignion
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `VITE_CONVEX_URL`: Your Convex deployment URL
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key

4. **Set up Convex**
   ```bash
   npx convex dev
   ```

5. **Set up Clerk**
   - Create a Clerk application at [clerk.dev](https://clerk.dev)
   - Configure the authentication settings
   - Add your keys to `.env.local`

6. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
campaignion/
├── src/
│   ├── components/         # React components
│   │   └── ui/            # ShadCN/UI components
│   ├── pages/             # Route pages
│   ├── lib/               # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── convex/            # Convex functions
├── convex/                # Convex schema and functions
└── text_files/            # Project documentation
```

## D&D 5e Features

### Authentication & Authorization
- **Global Roles**: Admin (full access) and User (standard)
- **Campaign Roles**: DM (Campaign Master) and Player
- **Permissions**: Role-based CRUD operations with campaign-specific access

### Monster Management
- Challenge Rating (CR 0-30) with automatic XP calculation
- Legendary and Lair actions for boss monsters
- Server-side ability modifier calculations
- Full stat blocks with D&D 5e compliance

### Character Management
- Complete D&D 5e character sheets
- Automatic ability modifier and proficiency bonus calculations
- Equipment and inventory with weight tracking
- Level progression and XP management

### Quest System
- Quest status tracking (idle, in_progress, completed, failed)
- Task dependencies and assignment
- Multiple task types (Fetch, Kill, Speak, Explore, etc.)
- XP and reward distribution

### Combat & Initiative
- Initiative tracking with Dex modifiers
- Turn-based combat management
- Map integration for tactical combat
- Action economy tracking

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This project is not affiliated with Wizards of the Coast. D&D 5e is a trademark of Wizards of the Coast LLC. 