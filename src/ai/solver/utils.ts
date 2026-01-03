import { GameState } from "../../models/gamestate.js";
import { Move, Orientation, Player } from "../../models/interfaces.js";

// TODO: move to minimax because every solver needs its own cache?
/**
 * Memoization cache for win/loss evaluation
 */
const memo = new Map<string, boolean>();

/**
 * Generate a unique key for a game state for memoization
 * Uses the snapshot data for efficient serialization
 */
export function stateKey(state: GameState): string {
  const snapshot = state.save();
  return JSON.stringify(snapshot);
}

/**
 * Generate all legal moves for a given game state
 * @param state - The current game state
 * @returns Array of all valid moves
 */
export function getLegalMoves(state: GameState): Omit<Move, 'player'>[] {
  const moves: Omit<Move, 'player'>[] = [];

  // Iterate through all positions and orientations
  for (let rowIndex = 0; rowIndex < state.rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < state.columns.length; colIndex++) {
      // Check all four orientations
      const orientations = [
        Orientation.TOP,
        Orientation.BOTTOM,
        Orientation.LEFT,
        Orientation.RIGHT,
      ];

      for (const orientation of orientations) {
        if (state.isValidMove(rowIndex, colIndex, orientation)) {
          moves.push({
            orientation,
            position: [rowIndex, colIndex],
          });
        }
      }
    }
  }

  return moves;
}

/**
 * Apply a move to a game state and return a new state without mutating the original
 * @param state - The current game state
 * @param move - The move to apply
 * @returns A new GameState with the move applied
 */
export function applyMove(state: GameState, move: Omit<Move, 'player'>): GameState {
  // Clone the state using save/load
  const snapshot = state.save();
  const newState = GameState.load(snapshot);

  // Apply the move to the cloned state
  newState.take(move.position[0], move.position[1], move.orientation);

  return newState;
}

// TODO: recfractor out of utils and into minimax because every solver needs its own implementation?
/**
 * Determine if the current position is a winning position
 * A winning position is one where the current player can force a win
 * @param state - The current game state
 * @returns true if the current position is winning, false if losing
 */
export function isWinning(state: GameState, counter: Counter): boolean {
  const key = stateKey(state);

  // Check memoization cache
  if (memo.has(key)) {
    return memo.get(key)!;
  }

  // Get all legal moves
  const moves = getLegalMoves(state);

  // Terminal position (no legal moves) is a losing position
  if (moves.length === 0) {
    memo.set(key, false);
    return false;
  }

  // Check if any move leads to a losing position for the opponent
  for (const move of moves) {
    counter.increment();
    const nextState = applyMove(state, move);
    // TODO: danger of running into maximum call stack size
    if (!isWinning(nextState, counter)) {
      // Found a move that leads to a losing position for opponent
      memo.set(key, true);
      return true;
    }
  }

  // All moves lead to winning positions for the opponent
  memo.set(key, false);
  return false;
}

export class Counter {
    private value: number = 0;
  
    increment() {
      this.value++;
    }

    get count() {
      return this.value;
    }
  }