// CLI - Beta
// TODO: refractor whole process

import readline from 'readline';
import { GameState } from '../models/gamestate.js';
import { Orientation } from '../models/interfaces.js';
import plotter from './plotter.js';
import { MCTSSolver } from '../ai/solver/mcts.js';

// flags
const SHOW_PATTERNS = false;

// init game
const game = new GameState();
const solver = new MCTSSolver();
solver.initialize(game);

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

rl.question('Enter board size (e.g. 6x6): ', (answer) => {
  const match = answer.trim().match(/^(\d+)\s*[xX]\s*(\d+)$/);
  let size: [number, number] = [6, 6]; // default
  if (match) {
    size = [parseInt(match[1]), parseInt(match[2])];
  } else {
    console.log('Invalid input. Using default size 6x6.');
  }

  game.init({ size });

  // initial plot after init
  plotter.field(game.rows);
  rl.prompt();
});

// this is a loop
rl.on('line', (line: string) => {
  // check for winning
  if (game.isFinished()) {
    console.log('You Lost!');
    rl.close();
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

  // AI is player 1, because HUMAN is starting first
  const move = solver.bestMove(1); 

  if (move === null) {
    console.log('you won');
    rl.close();
    return;
  }

  const eMove = game.takeById(move.id, move.orientation);

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
