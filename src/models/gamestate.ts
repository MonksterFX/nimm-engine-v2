import { GameOptions, Orientation } from './interfaces';
import { createEmtpy2D } from '../utils';
import { Field } from './field';
import { BitTable } from '../ai/utils/bittable';

export class GameState {
  private gameField: Field[][] = [];
  private gameFieldInverted: Field[][] = [];

  constructor(gameOptions?: GameOptions) {
    if (gameOptions) {
      this.init(gameOptions);
    }
  }

  init(gameOptions: GameOptions): GameState {
    // prefill array
    this.gameField = createEmtpy2D(...gameOptions.size);
    this.gameFieldInverted = createEmtpy2D(
      gameOptions.size[1],
      gameOptions.size[0]
    );

    for (let row = 0; row < gameOptions.size[0]; row++) {
      for (let col = 0; col < gameOptions.size[1]; col++) {
        const field = new Field(row, col);
        this.gameField[row][col] = field;
        this.gameFieldInverted[col][row] = field;
      }
    }

    return this;
  }

  // TODO: Deep Copy
  public get rows(): Field[][] {
    return this.gameField;
  }

  // TODO: Deep Copy
  public get columns(): Field[][] {
    return this.gameFieldInverted;
  }

  // TODO: Deep Copy
  getFromSide(index: number, orientation: Orientation): Field[] {
    return this.getArray(index, index, orientation);
  }

  getSideLength(orientation: Orientation) {
    if (orientation % 2 == 0) {
      return this.gameField[0].length;
    } else {
      return this.gameField.length;
    }
  }

  getArray(row: number, col: number, orientation: Orientation): Field[] {
    let arr: Field[];

    if (orientation % 2 == 0) {
      // top-bottom
      arr = this.columns[col];
    } else {
      // left-right
      arr = this.rows[row];
    }

    return orientation < 0 ? [...arr].reverse() : arr;
  }

  isFinished(): boolean {
    return this.gameField.flat().filter((v) => v.state === 1).length <= 1;
  }

  isValidMove(row: number, col: number, orientation: Orientation): boolean;

  isValidMove(arr: Field[], index: number): boolean;

  isValidMove(...args: any[]): boolean {
    let index: number;
    let arr: Field[];

    if (typeof args[0] === 'number' && typeof args[1] === 'number') {
      const rowIndex = args[0];
      const columnIndex = args[1];
      const orientation = args[2];
      const takeIndex = orientation % 2 == 0 ? rowIndex : columnIndex;

      arr = this.getArray(rowIndex, columnIndex, orientation);
      index = orientation < 0 ? arr.length - 1 - takeIndex : takeIndex;
    } else {
      arr = args[0];
      index = args[1];
    }

    let hitFirst = false;

    // check if game is allready finished
    if (this.isFinished()) {
      return false;
    }

    // check move
    for (let i = 0; i <= index; i++) {
      hitFirst = hitFirst || arr[i].state === 1;
      if (hitFirst && arr[i].state === 0) {
        return false;
      }
    }

    // if no stone was hit, the move is invalid
    return hitFirst;
  }

  take(row: number, column: number, orientation: Orientation): number {
    const arr = this.getArray(row, column, orientation);
    const takeIndex = orientation % 2 == 0 ? row : column;
    const takeNumber = orientation < 0 ? arr.length - 1 - takeIndex : takeIndex;

    // TODO: check if move is allowed
    if (!this.isValidMove(arr, takeNumber)) {
      throw Error(`invalid move`);
    }

    const protocol = [];

    for (let i = 0; i <= takeNumber; i++) {
      const result = arr[i].take();
      protocol.push(result);
    }

    // return number of stone taken
    return protocol.reduce((last, current) => (current ? last + 1 : last), 0);
  }

  get BitTable() {
    const bitSize = this.rows.flat().length;

    if (bitSize > 60) {
      throw new Error(
        `bit table has a max size of 60 bits, you requested ${bitSize}`
      );
    }

    const byteSize = 4 + 3 + Math.ceil(bitSize / 8);

    return BitTable.full(Math.ceil(bitSize / 8));
  }
}
