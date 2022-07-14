import { GameState } from './gamestate';

export class MinifiedGameState {
  field: boolean[][];
  invertedField: boolean[][];

  constructor(field: boolean[][]) {
    this.field = field;
    this.invertedField = field;
  }

  static fromGameState(gameState: GameState) {}

  copy() {}
}
