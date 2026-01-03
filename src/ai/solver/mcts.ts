import { Move, Solver } from "./solver";
import { GameState } from "../../models/gamestate";

export class MCTSSolver implements Solver {
  readonly name = "MCTS Solver";
  readonly description =
    "A solver that uses the MCTS algorithm to find the best move";

  mcts: MCTS | null = null;

  initialize(gameState: GameState): void {
    this.mcts = new MCTS(gameState);
  }

  bestMove(): Move | null {
    this.mcts?.run(100);
    return this.mcts?.bestMove() ?? null;
  }

  afterMove(move: any, gameState: GameState): void {
    this.mcts?.advanceRoot(move, gameState);
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

    console.assert(move, 'move is undefined');
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

    return simState.getCurrentPlayer();
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

  bestMove(): any {
    const best = this.root.children.reduce((a, b) =>
      a.visits > b.visits ? a : b
    );
    return best.move;
  }

  advanceRoot(move: any, newState: GameState): void {
    const child = this.root.children.find((c) => c.move === move);
    if (!child) {
      console.warn("advanceRoot: child not found");
    }
    this.root = child ?? new MCTSNode(newState, null);
  }
}
