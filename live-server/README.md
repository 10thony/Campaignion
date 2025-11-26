# Live Interaction Server

Real-time D&D 5e live interaction server with tRPC and WebSocket support.

## Features

- Real-time multiplayer D&D 5e sessions
- Turn-based gameplay with initiative order
- WebSocket connections for real-time updates
- tRPC API for type-safe client-server communication
- Clerk authentication integration
- Convex database integration
- Docker containerization support

## Development Setup

1. Install dependencies:
```bash
bun install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`

4. Start development server:
```bash
bun run dev
```

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun start` - Start production server
- `bun test` - Run tests
- `bun run test:watch` - Run tests in watch mode
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues
- `bun run type-check` - Run TypeScript type checking

## Docker

### Development
```bash
docker-compose up live-server
```

### Production
```bash
docker-compose --profile production up live-server-prod
```

## Project Structure

```
src/
├── index.ts          # Main server entry point
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── routers/          # tRPC router definitions
├── middleware/       # Express and tRPC middleware
├── services/         # Business logic services
└── test/             # Test setup and utilities
```

## API Endpoints

- `GET /health` - Health check endpoint
- WebSocket connections for real-time communication
- tRPC endpoints (to be implemented in future tasks)

## Environment Variables

See `.env.example` for all available configuration options.

## Testing

The project uses Vitest for testing. Test files should be placed alongside source files with `.test.ts` or `.spec.ts` extensions.

## Contributing

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all linting and type checking passes