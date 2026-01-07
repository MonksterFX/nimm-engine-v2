import { Move, Solver } from "./solver.js";
import { GameState } from "../../models/gamestate.js";

export class MCTSSolver implements Solver {
  readonly name = "MCTS Solver";
  readonly description =
    "A solver that uses the MCTS algorithm to find the best move";

  private mcts: MCTS | null = null;
  private currentState: GameState | null = null;

  /**
   * Initializes the solver with a game state
   * @param gameState - The initial game state
   */
  initialize(gameState: GameState): void {
    this.currentState = gameState;
    this.mcts = new MCTS(gameState.clone());
  }

  /**
   * Gets the best move from the current game state
   * @param gameState - The current game state
   * @param optimizeFor - Whether to optimize for 'win' or 'loss' (currently only 'win' is supported)
   * @returns The best move or null if no moves are available
   */
  bestMove(gameState: GameState, optimizeFor: "win" | "loss"): Move | null {
    // Initialize if not already initialized or if state changed
    if (!this.mcts || this.currentState !== gameState) {
      this.initialize(gameState);
    }

    // Run MCTS with iterations (more iterations = better play, but slower)
    const iterations = optimizeFor === "win" ? 500 : 200;
    this.mcts.run(iterations);

    const move = this.mcts.bestMove();
    if (!move) {
      // Fallback: return a random move if MCTS didn't find one
      const validMoves = gameState.getAllValidMoves();
      if (validMoves.length === 0) return null;
      const randomMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      return { id: randomMove.id, orientation: randomMove.orientation };
    }

    return move;
  }

  /**
   * Updates the solver after a move has been made
   * @param move - The move that was made
   * @param gameState - The new game state after the move
   */
  afterMove(move: any, gameState: GameState): void {
    if (this.mcts) {
      this.mcts.advanceRoot(move, gameState);
    }
    this.currentState = gameState;
  }
}

class MCTSNode {
  state: GameState;
  parent: MCTSNode | null;
  children: MCTSNode[] = [];
  move: Move;

  visits = 0;
  wins = 0; // from the perspective of the player who made the move

  untriedMoves: Move[];

  constructor(state: GameState, parent: MCTSNode | null, move: any = null) {
    this.state = state;
    this.parent = parent;
    this.move = move;
    this.untriedMoves = state.getAllValidMoves();
  }

  get uctValue(): number {
    if (this.visits === 0) return Infinity;
    const C = Math.sqrt(2);
    return (
      this.wins / this.visits +
      C * Math.sqrt(Math.log(this.parent!.visits) / this.visits)
    );
  }

  bestChild(): MCTSNode {
    return this.children.reduce((a, b) => (a.uctValue > b.uctValue ? a : b));
  }
}

export class MCTS {
  root: MCTSNode;

  constructor(initialState: GameState) {
    this.root = new MCTSNode(initialState, null);
  }

  run(iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      const node = this.select(this.root);
      const expanded = this.expand(node);
      const winner = this.simulate(expanded.state);
      this.backpropagate(expanded, winner);
    }
  }

  select(node: MCTSNode): MCTSNode {
    while (!node.state.isFinished()) {
      if (node.untriedMoves.length > 0) {
        return node;
      }
      node = node.bestChild();
    }
    return node;
  }

  expand(node: MCTSNode): MCTSNode {
    if (node.untriedMoves.length === 0) return node;

    const move = node.untriedMoves.pop();
    const nextState = node.state.clone();

    console.assert(move, "move is undefined");
    nextState.takeById(move!.id, move!.orientation);

    const child = new MCTSNode(nextState, node, move);
    node.children.push(child);
    return child;
  }

  simulate(state: GameState): number {
    const simState = state.clone();

    while (!simState.isFinished()) {
      const moves = simState.getAllValidMoves();
      const move = moves[Math.floor(Math.random() * moves.length)];
      simState.takeById(move.id, move.orientation);
    }

    return simState.getCurrentPlayer() === 0 ? 1 : 0;
  }

  backpropagate(node: MCTSNode, winner: number): void {
    while (node !== null) {
      node.visits++;
      const player = node.state.getCurrentPlayer();
      if (winner === player) {
        node.wins++;
      }
      node = node.parent!;
    }
  }

  bestMove(): Move | null {
    if (this.root.children.length === 0) {
      // No children means no moves available or not expanded yet
      return null;
    }
    const best = this.root.children.reduce((a, b) =>
      a.visits > b.visits ? a : b
    );
    return best.move;
  }
  
  // should not be used
  // advanceRoot(move: any, newState: GameState): void {
  //   const child = this.root.children.find((c) => c.move === move);
  //   if (!child) {
  //     console.warn("advanceRoot: child not found");
  //   }
  //   this.root = child ?? new MCTSNode(newState, null);
  // }
}
