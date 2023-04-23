import { GameEngine } from './engine/index.js';
import { GameState } from './models/gamestate.js';
import { GameOptions } from './models/interfaces.js';

// export * from './models/interfaces';
// export { GameEngine } from './engine';
// export { GameState } from './models/gamestate';

export default function createGame(options?: GameOptions) {
  const game = new GameState();
  game.init(options ?? { size: [6, 6] });
  return new GameEngine(game);
}
