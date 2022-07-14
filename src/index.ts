export * from './models/interfaces';
export { GameEngine } from './engine';
export { GameState } from './models/gamestate';

import { GameEngine } from './engine';
import { GameState } from './models/gamestate';
import { GameOptions } from './models/interfaces';

export function createGame(options?: GameOptions) {
  const game = new GameState();
  game.init(options ?? { size: [6, 6] });
  return new GameEngine(game);
}
