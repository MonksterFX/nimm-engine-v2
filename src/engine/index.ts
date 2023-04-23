import { Field } from '../models/field.js';
import { GameState } from '../models/gamestate.js';
import { Move } from '../models/interfaces.js';
import {
  countArray,
  randomBetween,
  randomSelect,
  takeableIndices,
} from '../utils.js';

export class GameEngine {
  gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  nextMove(): Move {
    return this.randomMove();
  }

  //TODO: move to ai - seperation of concerns
  randomMove(): Move {
    // declaration return value
    let takePosition;

    // randomly select a side/edge to take stones from
    const side = randomSelect([-2, -1, 1, 2]);

    // TODO: move to gamestate
    // calculate length of selected side
    const sideLength =
      side % 2 === 0
        ? this.gameState.columns.length
        : this.gameState.rows.length;

    // select row/col index to select from
    const startIndex = randomBetween(0, sideLength - 1);

    // search a position to take from
    for (let x = 0; x < sideLength; x++) {
      const index = (startIndex + x) % sideLength;

      // extract row/colum from state
      const fields = this.gameState.getFromSide(index, side);

      // check if row/column has more than one stone which the engine can take
      if (countArray<Field>(fields, 'state', 1) > 0) {
        // get all indices we can take stones from
        const takeRange = takeableIndices(fields);

        // TODO: double checked?
        if (!takeRange) continue;

        // select a random field index
        takePosition = fields[randomBetween(...takeRange)].index;

        break;
      }
    }

    if (!takePosition) {
      throw Error('no move possible');
    }

    return {
      player: { name: 'system' },
      orientation: side,
      position: takePosition,
    };
  }
}
