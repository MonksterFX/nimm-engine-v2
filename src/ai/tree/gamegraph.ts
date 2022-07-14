import { cloneDeep } from 'lodash';
import { GameState } from '../../models/gamestate';
import { Orientation } from '../../models/interfaces';
import { TreeNode } from './tree';
import plot from '../../cli/plotter';

type ValidMove = {
  row: number;
  col: number;
  orientation: Orientation;
};

export let currentTreeSize = 0;

function makeMoves(gameState: GameState, depth: number): TreeNode {
  const node = new TreeNode();
  node.state = gameState;

  if (depth === 0) {
    return node;
  }

  currentTreeSize++;
  const validMoves: ValidMove[] = [];

  // go along all sides and craete patterns

  // get all valid moves
  for (var rowIndex = 0; rowIndex < gameState.rows.length; rowIndex++) {
    for (var colIndex = 0; colIndex < gameState.columns.length; colIndex++) {
      if (gameState.isValidMove(rowIndex, colIndex, Orientation.BOTTOM)) {
        validMoves.push({
          row: rowIndex,
          col: colIndex,
          orientation: Orientation.BOTTOM,
        });
      }

      if (gameState.isValidMove(rowIndex, colIndex, Orientation.TOP)) {
        validMoves.push({
          row: rowIndex,
          col: colIndex,
          orientation: Orientation.TOP,
        });
      }

      if (gameState.isValidMove(rowIndex, colIndex, Orientation.LEFT)) {
        validMoves.push({
          row: rowIndex,
          col: colIndex,
          orientation: Orientation.LEFT,
        });
      }

      if (gameState.isValidMove(rowIndex, colIndex, Orientation.RIGHT)) {
        validMoves.push({
          row: rowIndex,
          col: colIndex,
          orientation: Orientation.RIGHT,
        });
      }
    }
  }

  if (validMoves.length === 0) {
    node.isLeaf = true;
    return node;
  }

  for (const move of validMoves) {
    const state = cloneDeep(gameState);
    state.take(move.row, move.col, move.orientation);
    node.children.push(makeMoves(state, depth - 1));
  }

  return node;
}

export function createGameGraph(
  gameState: GameState,
  depth: number = 2,
  aiMove: boolean = false
): TreeNode {
  return makeMoves(gameState, depth);
}
