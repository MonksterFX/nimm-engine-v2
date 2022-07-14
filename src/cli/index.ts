// CLI - Beta
// TODO: refractor whole process

const readline = require('readline');
import { GameEngine } from '../engine';
import { GameState } from '../models/gamestate';
import { Orientation } from '../models/interfaces';
import plotter from './plotter';

// flags
const SHOW_PATTERNS = true;

// init game
const game = new GameState();
const engine = new GameEngine(game);

game.init({ size: [6, 6] });

// TODO: options
// -h: help
// -size: game field size

// map inputs to direction
const directionMapper: { [id: string]: Orientation } = {
  r: Orientation.RIGHT,
  l: Orientation.LEFT,
  t: Orientation.TOP,
  b: Orientation.BOTTOM,
};

// prepare cli input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Next Move? Format:[dir.row.col]\n',
});

interface CliMoveCallback {
  (game: GameState): boolean;
}

// callback for players move
function playerOneMove(): boolean {
  throw new Error('not implemented');
}

// callback for ai-players move
function playerTwoMove(): boolean {
  throw new Error('not implemented');
}

// initial plot
plotter.field(game.rows);

// this is a loop
rl.on('line', (line: string) => {
  // check for winning
  if (game.isFinished()) {
    console.log('You Lost!');
  }

  try {
    // parse input - todo: more verbose
    let [directionRaw, rowRaw, colRaw] = line.trim().split('.');

    let direction = directionMapper[directionRaw.toLowerCase()];
    let row = parseInt(rowRaw);
    let col = parseInt(colRaw);

    // make move
    game.take(row, col, direction);

    // plot gamestate to console
    plotter.field(game.rows);
  } catch (error) {
    console.error(error);
  }

  // engine move
  console.log('ai moves');

  const eMove = engine.nextMove();
  game.take(eMove.position[0], eMove.position[1], eMove.orientation);
  plotter.field(game.rows);

  if (SHOW_PATTERNS) {
    console.log('possible patterns');
    plotter.pattern(game.rows, true);
  }

  rl.prompt();
}).on('close', () => {
  console.log('Thanks for playing NIMM! - BETA');
  process.exit(0);
});

// ask for first move - start repl loop
rl.prompt();
