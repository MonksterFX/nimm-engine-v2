import { assert } from 'console';
import { randomUUID } from 'crypto';
import BitUtils from './bit';
import { BitTable } from './bittable';
import MatrixFunctions from './matrix';
import { TreeNode } from './node';

export type PatternSize = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type RotationDegree = '90deg' | '180deg' | '270deg';

export class Pattern extends TreeNode {
  constructor(
    private data: BitTable,
    private sides = 0b1111 // TODO: change to dynamics
  ) {
    super(randomUUID());
  }

  static full(size: PatternSize): Pattern {
    return new Pattern(BitTable.full(size));
  }

  /** removes inplace */
  remove(row: number, col: number): Pattern {
    this.data.clearBit(row, col);
    return this;
  }

  /** removes inplace */
  removeTo(toRow: number, col: number): Pattern {
    for (let row = 0; row <= toRow; row++) {
      this.data.clearBit(row, col);
    }

    return this;
  }

  /**
   * creates a deep copy
   * @returns
   */
  copy(): Pattern {
    return new Pattern(this.data.copy(), this.sides);
  }

  get bytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(this.data.size + 1);
    const view = new DataView(buffer);
    const settings = (this.sides << 4) | this.size;

    view.setUint8(0, settings);

    for (let byteIndex = 0; byteIndex < this.data.size; byteIndex++) {
      const value = new DataView(this.data.buffer).getUint8(
        this.data.size - 1 - byteIndex
      );
      view.setUint8(this.data.size - byteIndex, value);
    }

    return view.buffer;
  }

  get matrix(): boolean[][] {
    let array = BitUtils.bit2array(this.data.buffer);
    array = array.slice(-(this.size ** 2));
    array = array.reverse(); // change order from right-left to left-right

    assert(array.length === this.size ** 2);

    const matrix: boolean[][] = [];

    for (let row = 0; row < this.size; row++) {
      matrix.push(array.slice(row * this.size, row * this.size + this.size));
    }

    return matrix;
  }

  /**
   * rotate pattern 90° clockwise and return new pattern instance
   * @returns pattern instance
   */
  getRotated(degree: RotationDegree = '90deg'): Pattern {
    const switchMap: Record<RotationDegree, number> = {
      '90deg': 1,
      '180deg': 2,
      '270deg': 3,
    };

    let rotated: boolean[][] = this.matrix;

    for (
      let rotationIndex = 0;
      rotationIndex < switchMap[degree];
      rotationIndex++
    ) {
      rotated = MatrixFunctions.rotateClockwise(rotated);
    }

    const bitTable = BitTable.from(this.data.size, rotated);
    return new Pattern(bitTable);
  }

  toJSON() {
    return { size: this.size, pattern: this.matrix };
  }

  printBinary() {
    BitUtils.prettyPrint(this.data.buffer);
  }

  printTable() {
    console.table(this.matrix);
  }

  get size() {
    return this.data.size;
  }

  get hash(): string {
    const firstByte = new DataView(new ArrayBuffer(1));
    firstByte.setUint8(0, (this.size << 4) | this.sides);

    // concat hack: https://gist.github.com/72lions/4528834
    const hash = new Uint8Array([
      ...new Uint8Array(firstByte.buffer),
      ...new Uint8Array(this.data.buffer),
    ]);

    return BitUtils.toString(hash.buffer, '', 'hex');
  }
}
