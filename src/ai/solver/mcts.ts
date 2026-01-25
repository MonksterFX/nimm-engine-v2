import { Move, Solver } from './solver.js';
import { GameState } from '../../models/gamestate.js';
import { convertOrientation } from '../utils/utils.js';

export class MCTSSolver implements Solver {
  readonly name = 'MCTS Solver';
  readonly description =
    'A solver that uses the MCTS algorithm to find the best move';

  mcts: MCTS | null = null;
  private currentState: GameState | null = null;

  /**
   * Initializes the solver with a game state
   * @param gameState - The initial game state
   */
  initialize(gameState: GameState): void {
    this.currentState = gameState.clone();
    this.mcts = new MCTS(this.currentState);
  }

  /**
   * Gets the best move from the current game state
   * @param gameState - The current game state
   * @returns The best move or null if no moves are available
   */
  bestMove(optimizeForPlayer: number): Move | null {
    // Initialize if not already initialized or if state changed
    if(!this.mcts || !this.currentState) throw new Error("solver not initialized");

    // Run MCTS with iterations (more iterations = better play, but slower)
    const iterations = 1000;
    this.mcts.run(iterations, optimizeForPlayer);

    const move = this.mcts.bestMove();
    
    if (!move) {
      // Fallback: return a random move if MCTS didn't find one
      console.warn("MCTS: no move found, returning random move");
      const validMoves = this.currentState.getAllValidMoves();
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
  update(gameState: GameState): void {
    this.currentState = gameState.clone();
  }
}

/**
 * The MCTSNode class represents a node in the MCTS tree
 */
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

  /**
   * Calculates the UCT value of the node
   * @returns The UCT value
   */
  get uctValue(): number {
    if (this.visits === 0) return Infinity;
    const C = Math.sqrt(2);
    return (
      this.wins / this.visits +
      C * Math.sqrt(Math.log(this.parent!.visits) / this.visits)
    );
  }

  /**
   * Returns the best child of the node based on the UCT value
   * @returns The best child node
   */
  bestChild(): MCTSNode {
    return this.children.reduce((a, b) => (a.uctValue > b.uctValue ? a : b));
  }
}

/**
 * The MCTS class implements the MCTS algorithm
*/
export class MCTS {
  // the root node of the MCTS tree
  root: MCTSNode;

  /**
   * Creates a new MCTS instance
   * @param initialState - The initial game state
   */
  constructor(initialState: GameState) {
    this.root = new MCTSNode(initialState, null);
  }

  /**
   * Runs the MCTS algorithm
   * @param iterations - The number of iterations to run
   * @param optimizeForPlayer - The player to optimize for
   */
  run(iterations: number, optimizeForPlayer: number): void {
    for (let i = 0; i < iterations; i++) {
      const node = this.select(this.root);
      const expanded = this.expand(node);
      const isWinner = this.simulate(expanded.state, optimizeForPlayer);
      this.backpropagate(expanded, isWinner);
    }
  }

  /**
   * Selects the node to expand
   * @param node - The node to select
   * @returns 
   */
  select(node: MCTSNode): MCTSNode {

    // while the game is not finished
    while (!node.state.isFinished()) {
      
      // if there are untried moves, return the node
      if (node.untriedMoves.length > 0) {
        return node;
      }

      // select the best child
      node = node.bestChild();
    }

    // if the game is finished, return the node
    return node;
  }

  /**
   * Expands the node by creating a new child node
   * @param node - The node to expand
   * @returns The new child node
   */
  expand(node: MCTSNode): MCTSNode {

    // if there are no untried moves, return the node
    if (node.untriedMoves.length === 0) return node;

    // pop a random untried move
    const move = node.untriedMoves.pop();

    // clone the state
    const nextState = node.state.clone();

    // play the move
    if (!move) throw new Error("move is undefined");
    nextState.takeById(move.id, move.orientation);

    // create a new child node
    const child = new MCTSNode(nextState, node, move);

    // add the child to the node's children
    node.children.push(child);

    // return the new child node
    return child;
  }

  /**
   * Simulates the game until it is finished
   * @param state - The state to simulate
   * @param optimizeForPlayer - The player to optimize for
   * @returns True if the player we are optimizing for is the winner, false otherwise
   */
  simulate(state: GameState, optimizeForPlayer: number): boolean {
    const simState = state.clone();

    // simulate the game until it is finished
    while (!simState.isFinished()) {

      // get all valid moves
      const moves = simState.getAllValidMoves();

      // select a random move as required by the algorithm
      const move = moves[Math.floor(Math.random() * moves.length)];

      // play the move and continue simulating
      simState.takeById(move.id, move.orientation);
    }

    // after the game is finished the losing player is the current player
    return simState.getCurrentPlayer() !== optimizeForPlayer;
  }

  /**
   * Propagates the result to all nodes up to the root
   * @param node - The node to propagate the result to
   * @param isWinner - True if the node is the winner, false otherwise
   */
  backpropagate(node: MCTSNode, isWinner: boolean): void {
    // propagate the result to all nodes up to the root
    while (node !== null) {

      // increment the number of visits to the node
      node.visits++;

      // if the node is the winner, increment the number of wins
      if (isWinner) {
        node.wins++;
      }

      // propagate the result to the parent
      node = node.parent!;
    }
  }

  /**
   * Returns the best move from the root node based on the number of visits
   * @returns The best move or null if no moves are available
   */
  bestMove(): Move | null {

    if (this.root.children.length === 0) {
      // No children means no moves available or not expanded yet
      return null;
    }

    // helps to understand the decision making process
    if(process.env.ALGO_DEBUG){
      console.log("MCTS: uct values");
      console.table(this.root.children.map((c) => ({
        move: `${c.move.id} ${convertOrientation(c.move.orientation)}`,
        uct: c.uctValue,
        visits: c.visits,
        wins: c.wins,
      })).sort((a, b) => b.uct - a.uct));
    }

    // find the child with the most visits
    const best = this.root.children.reduce((a, b) =>
      a.visits > b.visits ? a : b,
    );

    // return the move of the best child
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
