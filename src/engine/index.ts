import { GameState } from '../models/gamestate.js';
import { MoveWithoutPlayer, PlayerType } from '../models/interfaces.js';
import {
  randomSelect,
} from '../utils.js';

import { Solver } from '../ai/solver/solver.js';
import { MCTSSolver } from '../ai/solver/mcts.js';

/**
 * Multiplayer Game Engine
 */
export class GameEngine {
  private gameState: GameState;
  private players: [PlayerType, PlayerType];
  private options: { difficulty: 'easy' | 'hard' };
  private solver: Solver;

  constructor(gameState: GameState, players: [PlayerType, PlayerType], options: { difficulty: 'easy' | 'hard' } = { difficulty: 'hard' }) {
    this.gameState = gameState;
    this.players = players;
    this.options = options;
    this.solver = new MCTSSolver();
  }

  /**
   * Get the next move for the current player
   * @returns The next move for the current player
   */
  nextMove(): MoveWithoutPlayer {
    if (this.options.difficulty === 'hard') {
      const bestMove = this.solver.bestMove(this.gameState, 'win');
      if(!bestMove) throw new Error('no winning move exists');
      const position = this.gameState.convertIdToPosition(bestMove.id);
      return { orientation: bestMove.orientation, position: [position.row, position.col] };
    }
    console.warn('no winning move exists, falling back to random move');
    return this.randomMove();
  }

  //TODO: move to ai - seperation of concerns, add change to winning parameter
  randomMove(): MoveWithoutPlayer {
    const validMoves = this.gameState.getAllValidMoves();
    const randomMove = randomSelect(validMoves);
    const position = this.gameState.convertIdToPosition(randomMove.id);

    return {
      orientation: randomMove.orientation,
      position: [position.row, position.col],
    };
  }
}
