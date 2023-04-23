import { MoveInfo } from './interfaces.js';

export class Field {
  readonly id: number;
  readonly index: [number, number];
  private patternGroupNumber: number = -1;
  static idCounter = 0;
  state: number = 1;

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
}
