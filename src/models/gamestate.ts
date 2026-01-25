import { GameOptions, Orientation, Snapshot } from './interfaces.js';
import { createEmtpy2D } from '../utils.js';
import { Field } from './field.js';
import { BitTable } from '../ai/utils/bittable.js';
import { convertOrientation } from '../ai/utils/utils.js';

export class GameState {
  /** Current player, 0 or 1 */
  currentPlayer: number = 0;
  private gameField: Field[][] = [];

  /** Inverted game field for faster column access, references to the same fields as gameField */
  private gameFieldInverted: Field[][] = [];

  constructor(gameOptions?: GameOptions) {
    if (gameOptions) {
      this.init(gameOptions);
    }
  }

  init(gameOptions: GameOptions): GameState {
    // TODO: hotfix
    Field.resetCounter();
    // prefill array
    this.gameField = createEmtpy2D(...gameOptions.size);
    this.gameFieldInverted = createEmtpy2D(
      gameOptions.size[1],
      gameOptions.size[0],
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

  public clone(): GameState {
    const game = new GameState();

    // copy game field
    game.gameField = this.gameField.map((row) =>
      row.map((field) => field.copy()),
    );
    game.gameFieldInverted = createEmtpy2D(
      this.gameFieldInverted.length,
      this.gameFieldInverted[0].length,
    );

    for (let row = 0; row < game.gameField.length; row++) {
      for (let col = 0; col < game.gameField[0].length; col++) {
        game.gameFieldInverted[col][row] = game.gameField[row][col];
      }
    }

    game.currentPlayer = this.currentPlayer;

    return game;
  }

  getCurrentPlayer(): number {
    return this.currentPlayer;
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

    const _stonesOnBoard = this.gameField
      .flat()
      .filter((v) => v.state === 1).length;

    for (let i = 0; i < length; i++) {
      const arr = this.getFromSide(i, orientation);

      // we can take stones from the start to the first empty field
      let stoneFlag = false;

      let stonesOnBoard = _stonesOnBoard;

      for (let step = 0; step < arr.length; step++) {
        // empty field and we have already hit a stone
        if (arr[step].state === 0 && stoneFlag) break;

        // hit a stone
        if (arr[step].state === 1) {
          stoneFlag = true;

          // move is valid only if at least one stone is still on the board
          stonesOnBoard--;
          if (stonesOnBoard === 0) break;

          const id = arr[step].id;

          if (this.getById(id).state === 0) {
            console.table(
              this.gameField.map((row) => row.map((field) => field.state)),
            );
            console.table(
              this.gameField.map((row) => row.map((field) => field.id)),
            );
            const arr = this.getFromSide(i, orientation);
            throw new Error(`stone with id ${id} is not empty`);
          }

          idx.push(id);
        }
      }
    }

    return idx;
  }

  /**
   * Returns all valid moves for the current game state
   * @returns Array of all valid moves
   */
  getAllValidMoves() {
    const orientations = [
      Orientation.RIGHT,
      Orientation.LEFT,
      Orientation.TOP,
      Orientation.BOTTOM,
    ];
    const validMoves = orientations.map((orientation) =>
      this.getValidMoves(orientation).map((id) => ({ id, orientation })),
    );
    return validMoves.flat();
  }

  isValidMoveByIndex(id: number, orientation: Orientation) {
    const field = this.getById(id);
    return this.isValidMove(field.index[0], field.index[1], orientation);
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

  convertIdToPosition(id: number) {
    const field = this.getById(id);
    return { row: field?.index[0], col: field?.index[1] };
  }

  takeById(id: number, orientation: Orientation) {
    const position = this.convertIdToPosition(id);
    return this.take(position.row, position.col, orientation);
  }

  take(row: number, column: number, orientation: Orientation): number {
    const arr = this.getArray(row, column, orientation);
    const takeIndex = orientation % 2 == 0 ? row : column;
    const takeNumber = orientation < 0 ? arr.length - 1 - takeIndex : takeIndex;

    // TODO: check if move is allowed
    if (!this.isValidMove(arr, takeNumber)) {
      console.table(
        this.gameField.map((row) => row.map((field) => field.state)),
      );
      throw Error(
        `invalid move with id ${arr[takeNumber].id}, row ${row}, column ${column}, orientation ${convertOrientation(orientation)}`,
      );
    }

    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;

    const protocol = [];

    for (let i = 0; i <= takeNumber; i++) {
      const result = arr[i].take();
      protocol.push(result);
    }

    // return number of stone taken
    return protocol.reduce((last, current) => (current ? last + 1 : last), 0);
  }

  /** export snapshot game state */
  save(): Snapshot {
    return {
      gameOptions: { size: [this.rows.length, this.columns.length] },
      data: this.gameField.map((row) => row.map((field) => field.state)),
    };
  }

  /** restore game state from snapshot */
  static load({ gameOptions, data }: Snapshot): GameState {
    // Hotfix
    Field.resetCounter();
    const game = new this(gameOptions);
    for (let row = 0; row < game.gameField.length; row++) {
      for (let col = 0; col < game.gameField[0].length; col++) {
        game.gameField[row][col].state = data[row][col];
      }
    }
    return game;
  }

  get key(): string {
    const thisBitTable = this.toBitTable();
    return thisBitTable.getKeyString();
  }

  toBitTable(): BitTable {
    const bitSize = this.gameField.flat().length;
    const bitTable = BitTable.from(
      bitSize,
      this.gameField.map((row) => row.map((field) => field.state === 1)),
    );
    return bitTable;
  }

  prettyPrint(): void {
    console.table(this.gameField.map((row) => row.map((field) => field.state)));
  }
}
