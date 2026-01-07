import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { GameState } from '../src/models/gamestate';

export interface SingleRunOptions {
  iterations?: number;
}

export interface SingleRunResult {
  success: boolean;
  timeMs?: number;
  move?: {
    id: number;
    orientation: number;
  };
  iterations?: number;
  error?: string;
}

/**
 * Run the C implementation of single-run MCTS solver with a given GameState
 * @param gameState The current game state to find the best move for
 * @param options Configuration options for the solver
 * @returns Promise resolving to the result containing timing and move information
 */
export async function runSingleRunC(
  gameState: GameState,
  options: SingleRunOptions = {}
): Promise<SingleRunResult> {
  const {
    iterations = 2000,
  } = options;

  // Find the executable - check performance directory
  const executableName = process.platform === 'win32' 
    ? 'single-run.exe' 
    : 'single-run';
  
  // Try multiple paths
  const possiblePaths = [
    join(__dirname, executableName),  // If running from dist/
    join(__dirname, '..', 'performance', executableName),  // If running from dist/performance/
    join(process.cwd(), 'performance', executableName),  // From project root
    join(__dirname, '..', '..', 'performance', executableName),  // From dist/src/
  ];
  
  let executablePath: string | null = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      executablePath = path;
      break;
    }
  }
  
  if (!executablePath) {
    throw new Error(
      `C executable not found. Tried: ${possiblePaths.join(', ')}. ` +
      `Please compile it first with: npm run build:c`
    );
  }

  // Serialize GameState to JSON format
  const snapshot = gameState.save();
  const currentPlayer = gameState.getCurrentPlayer();
  
  const inputJson = JSON.stringify({
    snapshot: {
      gameOptions: snapshot.gameOptions,
      data: snapshot.data,
    },
    currentPlayer: currentPlayer,
    iterations: iterations,
  });

  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    // Write JSON to stdin
    child.stdin.write(inputJson);
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        // Try to parse error from stderr
        try {
          const errorResult = JSON.parse(stderr);
          resolve(errorResult);
        } catch {
          reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
        }
        return;
      }

      try {
        const result: SingleRunResult = JSON.parse(stdout.trim());
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse JSON output: ${stdout}. Error: ${error}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
  });
}

// Example usage
if (require.main === module) {
  const { GameState } = require('../src/models/gamestate');
  
  const game = new GameState();
  game.init({ size: [15, 15] });
  
  runSingleRunC(game, {
    iterations: 2000,
  })
    .then((result) => {
      if (result.success) {
        console.log(`Time taken: ${result.timeMs} milliseconds`);
        console.log(`Move: id=${result.move?.id}, orientation=${result.move?.orientation}`);
      } else {
        console.error('Error:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Failed to run C implementation:', error);
      process.exit(1);
    });
}

