import { Field } from './models/field';

export function createEmtpy2D(rows: number, cols: number) {
  return Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(null));
}

export function countArray<T>(arr: T[], key: keyof T, value: any) {
  return arr.filter((e) => e[key] === value).length;
}

export function takeableIndices(fields: Field[]): [number, number] | null {
  let firstValid = -1;
  let lastValid = -1;

  for (let i = 0; i < fields.length; i++) {
    if (firstValid === -1 && fields[i].state === 1) {
      firstValid = i;
      lastValid = i;
    }

    if (firstValid > -1 && fields[i].state === 1) {
      lastValid = i;
    }

    if (firstValid > -1 && fields[i].state !== 1) {
      break;
    }
  }

  if (firstValid === -1) {
    return null;
  }

  return [firstValid, lastValid];
}

export function randomBetween(low = 0, high = 1) {
  return Math.round(Math.random() * (high - low) + low);
}

export function randomSelect(arr: any[]) {
  return arr[Math.round(Math.random() * (arr.length - 1))];
}

export function takeRandom(field: Field[][], percentage = 0.25) {
  const maxTake = Math.floor(field[0].length * field.length * percentage);
  takeRandomField(field, 0, maxTake);
}

function takeRandomField(
  field: Field[][],
  count: number,
  stop: number,
  callstackSize = 0
): void {
  if (callstackSize > 1024) throw Error('maxmium depth exceeded!');

  const row = Math.round(Math.random() * (field.length - 1));
  const col = Math.round(Math.random() * (field[0].length - 1));

  const target = field[row][col];

  if (target.state === 1) {
    target.take();
    count++;
  }

  if (count >= stop) {
    return;
  }

  return takeRandomField(field, count, stop, callstackSize + 1);
}
