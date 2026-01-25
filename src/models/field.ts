import { MoveInfo } from './interfaces.js';

export class Field {
  static idCounter = 0;

  id: number;

  /**
   * Position of the field in the game field
   * [row, column]
   */
  readonly index: [number, number];

  private patternGroupNumber: number = -1;

  state: number = 1;

  static resetCounter() {
    Field.idCounter = 0;
  }

  constructor(row: number, col: number) {
    this.id = Field.idCounter;
    this.index = [row, col];
    Field.idCounter = Field.idCounter + 1;
  }

  set patternGroup(value: number) {
    this.patternGroupNumber = value;
  }

  get patternGroup(): number {
    return this.patternGroupNumber;
  }

  take(move?: MoveInfo) {
    // track if field was changed
    let changed = this.state !== 0;

    this.state = 0;

    return changed;
  }

  copy(): Field {
    const field = new Field(this.index[0], this.index[1]);
    field.state = this.state;
    field.patternGroup = this.patternGroup;
    field.id = this.id;
    return field;
  }
}
