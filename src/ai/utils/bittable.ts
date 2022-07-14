import { GameState } from '../../models/gamestate';
import BitUtils from './bit';

/**
 * bit representation of a pattern with size * size
 */
export class BitTable {
  private data: ArrayBuffer;
  private view: DataView;
  readonly size: number;

  private constructor(size: number, data: ArrayBuffer) {
    this.size = size;
    this.data = data;
    this.view = new DataView(this.data);
  }

  static from(size: number, arr: boolean[][]): BitTable {
    const data = BitUtils.array2bit(arr.flat());
    return new BitTable(size, data);
  }

  static empty(size: number) {
    const arr = Array<boolean[]>(size).fill(Array<boolean>(size).fill(false));
    return BitTable.from(size, arr);
  }

  static full(size: number) {
    const arr = Array<boolean[]>(size).fill(Array<boolean>(size).fill(true));
    return BitTable.from(size, arr);
  }

  /**
   *
   * @param row
   * @param col
   * @returns [byteOffset, index]
   */
  private calcIndexParam(row: number, col: number): [number, number] {
    const index = row * this.size + col;
    const byteOffset = index % 8;
    return [byteOffset, index];
  }

  setBit(row: number, col: number): void {
    const [byteOffset, index] = this.calcIndexParam(row, col);
    BitUtils.setBitRL(this.view, index);
  }

  clearBit(row: number, col: number): void {
    const [byteNumber, index] = this.calcIndexParam(row, col);
    BitUtils.clearBitRL(this.view, index);
  }

  getBit(row: number, col: number): boolean {
    const [byteNumber, index] = this.calcIndexParam(row, col);
    return BitUtils.getBitRL(this.view, index);
  }

  /**
   * creates a deep copy
   * @returns
   */
  copy(): BitTable {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/slice
    return new BitTable(this.size, this.buffer.slice(0));
  }

  get buffer() {
    return this.data;
  }

  get byteSize() {
    return this.data.byteLength;
  }
}
