import { GameState } from "../src";
import { MCTSSolver } from "../src/ai/solver/mcts";

const game = new GameState();
const size: [number, number] = [15, 15];
game.init({ size });

const solver = new MCTSSolver();
const iterations = 2000;

const start = performance.now();

solver.initialize(game.clone());
solver.mcts?.run(iterations);

const move = solver.bestMove();
if (!move) throw new Error("No move found");

try {
  game.takeById(move.id, move.orientation);
} catch (error) {
  console.error(error);
  console.table(game.rows.map((row) => row.map((field) => field.state)));
  process.exit(1);
}

const end = performance.now();
console.log(`Time taken: ${end - start} milliseconds`);