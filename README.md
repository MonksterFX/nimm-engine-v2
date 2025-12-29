# nimm-engine-v2

Complete rewrite of nimm-engine-v1.

## Table of Contents

- [What is Nimm](#what-is-nimm)
- [Installation](#installation)
- [Content](#content)
- [How to Play](#how-to-play)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Local Development with Vite](#local-development-with-vite)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Documentation](#documentation)
- [License](#license)

## What is Nimm

> Nim is a mathematical game of strategy in which two players take turns removing (or "nimming") objects from distinct heaps or piles.

From [Wikipedia](https://en.wikipedia.org/wiki/Nim)

This implementation features a 2D grid-based variant where players remove stones from rows or columns starting from the edges. See [Game Rules](docs/game-rules.md) for detailed gameplay mechanics.

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Install as Package

```bash
npm install nimm-engine-v2
```

### Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd nimm-engine-v2
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Content

The project consists of three main modules:

- **engine** - Core game logic, move validation, and state management. Handles game rules, move generation, and state transitions. See [src/engine/](src/engine/)
- **cli** - Command-line interface for playing the game interactively. Provides a terminal-based game experience. See [src/cli/](src/cli/)
- **ai** - AI algorithms including minimax, game graph analysis, and pattern matching for computer opponents. See [src/ai/](src/ai/)

## How to Play

### Using the CLI

Start the CLI interface:

```bash
npm run cli
```

Or in development mode:

```bash
npm run cli:dev
```

### Move Format

When prompted, enter your move in the format: `[dir.row.col]`

- **dir**: Direction/side to take from
  - `r` - Right
  - `l` - Left
  - `t` - Top
  - `b` - Bottom
- **row**: Row index (0-based)
- **col**: Column index (0-based)

### Example

```
Next Move? Format:[dir.row.col]
t.0.2
```

This takes stones from the top side, column 2 (0-indexed), starting from row 0.

### Gameplay Flow

1. The game displays the current board state
2. Enter your move in the format `[dir.row.col]`
3. The AI opponent makes its move automatically
4. The board updates and shows possible patterns (if enabled)
5. Continue until one player wins

For detailed game rules, see [Game Rules Documentation](docs/game-rules.md).

## API Documentation

### Main Exports

The package exports the following:

```typescript
import { createGame, GameEngine, GameState, Interfaces } from 'nimm-engine-v2';
```

### `createGame(options?)`

Creates a new game instance with the specified options.

```typescript
import { createGame } from 'nimm-engine-v2';

const game = createGame({ size: [6, 6] });
// Returns a GameEngine instance
```

**Parameters:**
- `options` (optional): `GameOptions` object
  - `size`: `[number, number]` - Grid dimensions as `[rows, columns]`

**Returns:** `GameEngine` instance

### `GameEngine`

Main game engine class that manages game state and provides move generation.

```typescript
import { GameEngine, GameState } from 'nimm-engine-v2';

const gameState = new GameState();
gameState.init({ size: [6, 6] });
const engine = new GameEngine(gameState);

// Get a move (currently returns random move)
const move = engine.nextMove();
```

**Methods:**
- `nextMove()`: Returns a `Move` object for the current player
- `randomMove()`: Returns a random valid move

### `GameState`

Represents the current state of the game board.

```typescript
import { GameState } from 'nimm-engine-v2';
import { Orientation } from 'nimm-engine-v2';

const game = new GameState();
game.init({ size: [6, 6] });

// Make a move
game.take(row, col, Orientation.TOP);

// Check if game is finished
const finished = game.isFinished();

// Get valid moves for an orientation
const validMoves = game.getValidMoves(Orientation.LEFT);

// Save/load game state
const snapshot = game.save();
const restored = GameState.load(snapshot);
```

**Key Methods:**
- `init(options)`: Initialize the game board
- `take(row, col, orientation)`: Remove stones from a position
- `isFinished()`: Check if the game has ended
- `getValidMoves(orientation)`: Get all valid move IDs for an orientation
- `save()`: Export current state as a snapshot
- `load(snapshot)`: Restore state from a snapshot

### `Interfaces`

TypeScript interfaces and enums for type safety.

```typescript
import { Interfaces } from 'nimm-engine-v2';

// Available types:
// - Player
// - Move
// - MoveInfo
// - GameOptions
// - Orientation (enum)
// - Snapshot
```

**Orientation Enum:**
- `Orientation.TOP = 2`
- `Orientation.BOTTOM = -2`
- `Orientation.LEFT = 1`
- `Orientation.RIGHT = -1`

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run cli` - Run the CLI interface using compiled JavaScript
- `npm run cli:dev` - Run the CLI interface in development mode with ts-node
- `npm run vite-pack` - Build the project and create an npm package tarball in `package/` directory

### Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run build` to compile
3. Test with `npm run cli:dev` for quick iteration
4. Use `npm run cli` to test the compiled version
5. Run `npm run vite-pack` to create a distributable package

### Project Structure

```
nimm-engine-v2/
├── src/
│   ├── engine/          # Game engine and rules
│   ├── cli/             # Command-line interface
│   ├── ai/              # AI algorithms
│   │   ├── graph/       # Game graph analysis
│   │   ├── tree/        # Tree-based algorithms (minimax)
│   │   └── utils/       # AI utility functions
│   ├── models/          # Data models and interfaces
│   └── index.ts         # Main entry point
├── dist/                # Compiled JavaScript output
├── docs/                # Documentation files
│   ├── game-rules.md    # Detailed game rules
│   └── ai-integration.md # AI integration guide
├── package.json
└── tsconfig.json
```

## Local Development with Vite

When developing with Vite or other ES module bundlers, `npm link` may not work correctly due to CommonJS/ES module compatibility issues.

**Solution:** Use `npm pack` to create a local package:

```bash
# Build and pack the package
npm run vite-pack

# In your Vite project, install the packed tarball
npm install ../nimm-engine-v2/package/nimm-engine-v2-0.0.3.tgz
```

The `vite-pack` script:
1. Builds the TypeScript project (`npm run build`)
2. Creates an npm package tarball using `npm pack`
3. Saves it to the `package/` directory

This creates a distributable package that can be installed in projects using ES modules.

## Dependencies

### Runtime Dependencies

- **lodash** (^4.17.21) - Utility functions
- **readline** (^1.3.0) - CLI input handling

### Development Dependencies

- **typescript** (^5.0.4) - TypeScript compiler
- **@types/node** (^16.11.9) - Node.js type definitions
- **@types/lodash** (^4.14.178) - Lodash type definitions
- **ts-node** (^10.8.2) - TypeScript execution for Node.js

## Documentation

Additional documentation is available in the `docs/` directory:

- [Game Rules](docs/game-rules.md) - Detailed explanation of game mechanics and rules
- [AI Integration Guide](docs/ai-integration.md) - Guide for integrating AI opponents

## License

MIT
