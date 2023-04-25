import { GameOptions, Orientation } from './interfaces.js';
import { createEmtpy2D } from '../utils.js';
import { Field } from './field.js';
import { BitTable } from '../ai/utils/bittable.js';

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

  getById(id: number) {
    // find row and col of id
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.columns.length; colIndex++) {
        if (this.rows[rowIndex][colIndex].id === id) {
          return this.rows[rowIndex][colIndex];
        }
      }
    }

    throw new Error(`field with id ${id} is not existing`);
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

  /**
   * returns all valid ids for the next move for a given orientation
   * @param orientation
   */
  getValidMoves(orientation: Orientation) {
    const idx: number[] = [];
    const length = this.getSideLength(orientation);

    for (let i = 0; i < length; i++) {
      const arr = this.getFromSide(i, orientation);

      let stoneFlag = false;

      for (let step = 0; step < arr.length; step++) {
        // exit condition
        if (arr[step].state === 0 && stoneFlag) break;

        if (arr[step].state === 1) {
          stoneFlag = true;
          idx.push(arr[step].id);
        }
      }
    }

    return idx;
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

  takeById(id: number, orientation: Orientation) {
    const field = this.getById(id);

    return this.take(field?.index[0], field?.index[1], orientation);
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
