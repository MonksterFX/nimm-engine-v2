import fs from 'fs';

import { GameState } from "../src/models/gamestate.js";
import { MCTSSolver } from "../src/ai/solver/mcts.js";

const sizes = [3, 5, 7, 9, 11, 13];
const iterations = [50, 100, 200, 500, 1000];

const results = {
  size: [] as number[],
  iterations: [] as number[],
  totalTime: [] as number[],
  averageMoveTime: [] as number[],
  maxMoveTime: [] as number[],
  minMoveTime: [] as number[],
  moves: [] as number[],
};

for (const iteration of iterations) {
  for (const size of sizes) {
    const game = new GameState();

    game.init({ size: [size, size] });

    const solver = new MCTSSolver();

    solver.initialize(game.clone());

    let i = 0;

    const start = performance.now();
    const moveTimes = [];
    while (!game.isFinished()) {
      const moveTime = performance.now();
      solver.mcts?.run(iteration);

      const move = solver.bestMove();
      if (!move) throw new Error("No move found");

      try {
        game.takeById(move.id, move.orientation);
      } catch (error) {
        console.error(error);
        console.table(game.rows.map((row) => row.map((field) => field.state)));
        process.exit(1);
      }

      solver.afterMove(move, game);

      // debug moves
      // console.table(game.rows.map((row) => row.map((field) => field.state)));
      // console.log(
      //   `Move ${i}: ${move.id} ${convertOrientation(move.orientation)}`
      // );

      i++;
      moveTimes.push(performance.now() - moveTime);
    }

    const end = performance.now();

    results.size.push(size);
    results.iterations.push(iteration);
    results.totalTime.push(Math.floor(end - start));
    results.averageMoveTime.push(
      Math.floor(moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length)
    );
    results.maxMoveTime.push(Math.floor(Math.max(...moveTimes)));
    results.minMoveTime.push(Math.floor(Math.min(...moveTimes)));
    results.moves.push(moveTimes.length);

    console.info(`Finished size ${size} with ${iteration} iterations in ${end - start} milliseconds`);
  }

  console.log(`Performance for iterations ${iteration} `);
  console.table(results);
  console.log("--------------------------------");
  
  // save results to file after each iteration
  fs.writeFileSync('performance/results.json', JSON.stringify(results, null, 2));
}

