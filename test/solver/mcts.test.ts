// TODO: make testing abstract to work with any solver

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { GameState } from '../../src/models/gamestate.js';
import { MCTSSolver } from '../../src/ai/solver/mcts.js';

// AI is player 0, opponent is player 1, because AI is starting first
const AI_PLAYER = 0;
const OPPONENT_PLAYER = 1;

/**
 * Runs a single game: AI (player 0) moves first, then alternates with opponent (random moves).
 * Uses a new MCTSSolver each AI turn so the search starts from the current position.
 * @returns True if AI wins, false if opponent wins.
 */
function runSingleGame() {
  const state = new GameState();
  state.init({ size: [3, 1] });
  state.currentPlayer = AI_PLAYER;

  const solver = new MCTSSolver();
  solver.initialize(state);

  assert.strictEqual(state.getCurrentPlayer(), AI_PLAYER, "AI should be the current player");

  const move = solver.bestMove(AI_PLAYER);
  assert.ok(move, "move should be found");

  state.takeById(move.id, move.orientation);

  // ensure opponent is now the current player
  assert.strictEqual(state.getCurrentPlayer(), OPPONENT_PLAYER, "opponent should be the next player after AI move");

  // state.prettyPrint();
  // solver.mcts?.root.children.forEach(c => {
  //   console.log(c.move.id, c.move.orientation, c.uctValue, c.visits, c.wins);
  // });

  // there is a perfect strategy to win, so game should be finished
  assert.ok(state.isFinished(), "game should be finished");
}

function runManyGames() {
  for (let i = 0; i < 100; i++) {
    // if not assertion error, game was successful
    runSingleGame();
  }
}

describe('MCTSSolver', () => {
  describe('3×1 game, AI is current player', () => {
    it('AI always wins over many games', () => {
      runManyGames();
    });
  });
});
