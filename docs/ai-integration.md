# AI Integration Guide for `nimm-engine-v2`

This document explains how to integrate a **single-player computer opponent** (perfect-play AI) into the `nimm-engine-v2` project for the 2D Nim-like game.

The approach uses **deterministic game solving (minimax with memoization)** and is suitable for your exact ruleset.

---

## 1. Game Characteristics

Your game is:

* Turn-based
* Two-player
* Perfect information
* No randomness
* Finite (stones strictly decrease)

This makes it a **combinatorial impartial game**, meaning every position is either:

* **Winning** (current player can force a win), or
* **Losing** (current player will lose with perfect play)

The AI’s goal is simple:

> **Always move to a losing position for the opponent.**

---

## 2. Repository Structure

The actual repository layout:

```
src/
 ├ engine/        # Game rules, state, move generation
 ├ ai/            # AI logic
 │  └ solver/     # Solver implementations
 │     ├ solver.ts    # Abstract Solver base class
 │     ├ minimax.ts   # MinimaxSolver implementation
 │     └ utils.ts     # Helper functions (getLegalMoves, applyMove, isWinning)
 ├ models/        # Game state and interface definitions
 └ cli/           # Human / AI turn control
```

The AI implementation lives in the **`ai/solver` directory** and only depends on the engine API. Helper functions are kept in the AI module (not the engine) to maintain separation of concerns for multiplayer support.

---

## 3. Required Engine Functions

The AI solver uses the engine's public API:

* `GameState` – full board state class with methods:
  * `isValidMove(row, col, orientation)` – checks if a move is valid
  * `take(row, col, orientation)` – applies a move (mutates state)
  * `save()` – exports state as a snapshot
  * `load(snapshot)` – static method to restore state from snapshot
* `Move` – interface representing a move with `player`, `orientation`, and `position`

The AI module provides its own helper functions:
* `getLegalMoves(state)` – generates all valid moves (in `ai/solver/utils.ts`)
* `applyMove(state, move)` – returns a new state with move applied (in `ai/solver/utils.ts`)

These helpers are kept in the AI module since they're only needed for the solver, allowing the engine to remain focused on game state management for both human multiplayer and AI modes.

---

## 4. AI Solver Design

We use **recursive win/loss evaluation** with memoization.

### Definitions

* **Winning position**: at least one legal move leads to a losing position
* **Losing position**: all legal moves lead to winning positions

Terminal position (no legal moves) is **losing**.

---

## 5. Solver Implementation

The solver is implemented using an object-oriented design with an abstract base class:

### File Structure

```
src/ai/solver/
 ├ solver.ts    # Abstract Solver base class
 ├ minimax.ts   # MinimaxSolver implementation
 └ utils.ts     # Helper functions
```

### Abstract Solver Base Class

**File**: `src/ai/solver/solver.ts`

```ts
import { GameState } from "../../models/gamestate"
import { Move } from "../../models/interfaces"

export abstract class Solver {
    abstract readonly name: string
    abstract readonly description: string
    abstract getNextMove(gameState: GameState): Move | null;
}
```

### Helper Functions

**File**: `src/ai/solver/utils.ts`

Contains the core logic:
- `getLegalMoves(state)` – generates all valid moves for a game state
- `applyMove(state, move)` – clones state and applies move (non-mutating)
- `isWinning(state)` – recursive win/loss evaluation with memoization
- `stateKey(state)` – generates unique key for memoization

The `isWinning` function uses memoization to cache results:

```ts
const memo = new Map<string, boolean>()

export function isWinning(state: GameState): boolean {
  const key = stateKey(state)
  if (memo.has(key)) return memo.get(key)!

  const moves = getLegalMoves(state)
  if (moves.length === 0) {
    memo.set(key, false)
    return false  // Terminal position is losing
  }

  for (const move of moves) {
    const nextState = applyMove(state, move)
    if (!isWinning(nextState)) {
      memo.set(key, true)
      return true  // Found a winning move
    }
  }

  memo.set(key, false)
  return false  // All moves lead to winning positions for opponent
}
```

### MinimaxSolver Implementation

**File**: `src/ai/solver/minimax.ts`

```ts
import { Solver } from './solver'
import { GameState } from '../../models/gamestate'
import { Move } from '../../models/interfaces'
import { getLegalMoves, applyMove, isWinning } from './utils'

export class MinimaxSolver extends Solver {
    readonly name = 'Minimax Solver'
    readonly description = 'A solver that uses the minimax algorithm to find the best move'
    
    getNextMove(gameState: GameState): Move | null {
      const moves = getLegalMoves(gameState)
      
      for (const move of moves) {
        const nextState = applyMove(gameState, move)
        if (!isWinning(nextState)) {
          // This move leads to a losing position for the opponent
          return { ...move, player: { name: 'ai' } }
        }
      }
      
      return null  // No winning move exists
    }
}
```

For convenience, standalone functions are also exported:

```ts
export function chooseBestMove(state: GameState): Move | null {
  const solver = new MinimaxSolver()
  return solver.getNextMove(state)
}
```

This produces a **perfect-play opponent**.

---

## 6. Integrating into the Game Loop

The solver is integrated into `GameEngine`:

**File**: `src/engine/index.ts`

```ts
import { chooseBestMove } from '../ai/solver/minimax'

export class GameEngine {
  private gameState: GameState
  private options: { difficulty: 'easy' | 'hard' }

  nextMove(): Move {
    if (this.options.difficulty === 'hard') {
      const bestMove = chooseBestMove(this.gameState)
      if (bestMove) {
        return bestMove
      }
      // Fall back to random move if no winning move exists
    }
    return this.randomMove()
  }
}
```

Alternatively, you can use the solver directly:

```ts
import { MinimaxSolver } from '../ai/solver/minimax'

const solver = new MinimaxSolver()
const move = solver.getNextMove(gameState)

if (move) {
  gameState.take(move.position[0], move.position[1], move.orientation)
}
```

If no winning move exists, the AI will return `null` and any legal move may be played (the engine falls back to a random move).

---

## 7. Difficulty Levels

The `GameEngine` supports difficulty modes:

* **Easy** – random legal move (uses `randomMove()`)
* **Hard** – full minimax solver (uses `chooseBestMove()`)

The difficulty is set when creating the engine:

```ts
const engine = new GameEngine(gameState, ['human', 'ai'], { difficulty: 'hard' })
```

Future enhancements could add:
* **Medium** – depth-limited solver (not yet implemented)
* Additional solver implementations extending the `Solver` base class

---

## 8. Performance Notes

For larger boards:

* Memoization is critical
* Use bitboards or compact state keys if possible
* Optional: detect mirror symmetry (horizontal / vertical flips)

For small-to-medium boards, this solver will be fast enough for real-time play.

---

## 9. Why This Works Well

* Exact rules respected
* No heuristics required
* Deterministic and debuggable
* Produces human-level or better play

This is the same theoretical foundation used for classic Nim and other take-away games.

---

## 10. Next Improvements

* Alpha–beta pruning
* Transposition tables with hashing
* UI move explanation ("AI removed X stones from left side")

---

**Result:** You now have a clean, maintainable, perfect single-player AI integrated into `nimm-engine-v2`. The implementation uses an object-oriented design with an abstract `Solver` base class, making it easy to add new solver implementations in the future. Helper functions are kept in the AI module to maintain separation of concerns, allowing the engine to support both human multiplayer and AI modes.
