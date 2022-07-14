/**
 * set bit right to left
 * @param byte
 * @param position
 */
function setBitRL(view: DataView, position: number): void {
  const byteIndex = position % 8;
  const byteOffset = view.byteLength - Math.floor(position / 8) - 1;
  const mask = 1 << byteIndex;

  let n = view.getUint8(byteOffset);
  n |= mask;

  view.setUint8(byteOffset, n);
}

/**
 * clear bit on position x right to left
 * @param byte
 * @param position
 */
function clearBitRL(view: DataView, position: number): void {
  const byteIndex = position % 8;
  const byteOffset = view.byteLength - Math.floor(position / 8) - 1;
  const mask = 1 << byteIndex;

  let n = view.getUint8(byteOffset);
  n &= ~mask;

  view.setUint8(byteOffset, n);
}

/**
 * get bit right to left
 * @param byte
 * @param position
 */
function getBitRL(view: DataView, position: number): boolean {
  const byteIndex = position % 8;
  const byteOffset = view.byteLength - Math.floor(position / 8) - 1;
  const mask = 1 << byteIndex;

  let n = view.getUint8(byteOffset);

  return (n & mask) != 0;
}

type Truthfully = boolean | number;

function array2bit(array: Truthfully[]): ArrayBuffer {
  const byteLength = Math.ceil(array.length / 8);
  const view = new DataView(new ArrayBuffer(byteLength));

  array.forEach((v, i) => {
    if (!!v) {
      setBitRL(view, i);
    }
  });

  return view.buffer;
}

function bit2array(buffer: ArrayBuffer): boolean[] {
  const view = new DataView(buffer);
  const array = [];

  for (let i = 0; i < view.byteLength * 8; i++) {
    array.push(getBitRL(view, i));
  }

  return array.reverse();
}

function leftPad(value: string, size: number = 8) {
  const nPad = size - value.length;

  if (nPad <= 0) return value;

  return `${Array(nPad).fill(0).join('')}${value}`;
}

type RenderType = 'binary' | 'hex';

function prettyPrint(
  array: ArrayBuffer,
  sep: string = ' ',
  renderType: RenderType = 'binary'
) {
  console.log(toString(array, sep, renderType));
}

function toString(
  array: ArrayBuffer,
  sep: string = ' ',
  renderType: RenderType = 'binary'
) {
  const view = new DataView(array);
  let rendered = '';

  for (let b = 0; b < array.byteLength; b++) {
    renderType === 'binary'
      ? (rendered += sep + leftPad(view.getUint8(b).toString(2), 8))
      : (rendered += sep + leftPad(view.getUint8(b).toString(16), 2));
  }

  return rendered;
}

const BitUtils = {
  setBitRL,
  getBitRL,
  clearBitRL,
  array2bit,
  bit2array,
  prettyPrint,
  toString,
};

export default BitUtils;
