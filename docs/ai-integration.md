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

## 2. Repository Structure (Expected)

From the repository layout:

```
src/
 ├ engine/   # Game rules, state, move generation
 ├ ai/       # AI logic (we add solver here)
 └ cli/      # Human / AI turn control
```

The AI implementation should live inside the **`ai` directory** and only depend on the engine API.

---

## 3. Required Engine Functions

The AI solver assumes the engine already provides:

* `GameState` – full board state
* `Move` – representation of a move
* `getLegalMoves(state)` – generates all valid moves
* `applyMove(state, move)` – returns the next state

If these do not yet exist, they must be implemented in `engine` first.

---

## 4. AI Solver Design

We use **recursive win/loss evaluation** with memoization.

### Definitions

* **Winning position**: at least one legal move leads to a losing position
* **Losing position**: all legal moves lead to winning positions

Terminal position (no legal moves) is **losing**.

---

## 5. Solver Implementation (TypeScript-style pseudocode)

Create a new file:

```
src/ai/solver.ts
```

```ts
import { GameState, Move, getLegalMoves, applyMove } from '../engine'

const memo = new Map<string, boolean>()

function stateKey(state: GameState): string {
  return JSON.stringify(state)
}

export function isWinning(state: GameState): boolean {
  const key = stateKey(state)
  if (memo.has(key)) return memo.get(key)!

  const moves = getLegalMoves(state)
  if (moves.length === 0) {
    memo.set(key, false)
    return false
  }

  for (const move of moves) {
    const next = applyMove(state, move)
    if (!isWinning(next)) {
      memo.set(key, true)
      return true
    }
  }

  memo.set(key, false)
  return false
}

export function chooseBestMove(state: GameState): Move | null {
  for (const move of getLegalMoves(state)) {
    const next = applyMove(state, move)
    if (!isWinning(next)) {
      return move
    }
  }
  return null
}
```

This produces a **perfect-play opponent**.

---

## 6. Integrating into the Game Loop

In the CLI or game controller (where turns are handled):

```ts
import { chooseBestMove } from '../ai/solver'

if (currentPlayer === 'AI') {
  const move = chooseBestMove(gameState)
  if (move) {
    gameState = applyMove(gameState, move)
  }
}
```

If no winning move exists, the AI will return `null` and any legal move may be played.

---

## 7. Difficulty Levels (Optional)

You can easily add difficulty modes:

* **Easy** – random legal move
* **Medium** – depth-limited solver
* **Hard** – full solver (this implementation)

Example:

```ts
if (difficulty === 'easy') randomMove()
else if (difficulty === 'medium') shallowSearch()
else chooseBestMove()
```

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

**Result:** You now have a clean, maintainable, perfect single-player AI integrated into `nimm-engine-v2`.
