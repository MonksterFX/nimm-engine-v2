import { GameEngine } from './engine/index.js';
import { GameState } from './models/gamestate.js';
import { GameOptions } from './models/interfaces.js';

export * as Interfaces from './models/interfaces.js';
export { GameEngine } from './engine/index.js';
export { GameState } from './models/gamestate.js';

export function createGame(options?: GameOptions) {
  const game = new GameState();
  game.init(options ?? { size: [6, 6] });
  return new GameEngine(game);
}

export default {
  createGame,
  GameEngine,
  GameState,
};
