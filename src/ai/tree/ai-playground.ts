import { GameState } from '../../models/gamestate';
import { createGameGraph, currentTreeSize } from '../tree/gamegraph';

const game = new GameState();
game.init({ size: [5, 4] });

const node = createGameGraph(game, 3, false);
node;
console.log(currentTreeSize);
