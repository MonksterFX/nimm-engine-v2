import { Field } from '../models/field.js';

export function findPatterns(gameField: Field[][]) {
  let currentGroup = 1;

  gameField.flat().forEach((field) => (field.patternGroup = -1));

  for (const field of gameField.flat()) {
    // skip if has pattern group or is null
    if (field.patternGroup > -1 || field.state === 0) {
      continue;
    }

    // create pattern
    findNeighbour(gameField, field.index[0], field.index[1], currentGroup);
    currentGroup++;
  }

  return currentGroup - 1;
}

export function findNeighbour(
  gameField: Field[][],
  row: number,
  col: number,
  patternGroupNumber: number
) {
  // check if in border
  if (
    row < 0 ||
    col < 0 ||
    row >= gameField.length ||
    col >= gameField[0].length ||
    gameField[row][col].state === 0 ||
    gameField[row][col].patternGroup > -1
  ) {
    return null;
  }

  // set to pattern group
  gameField[row][col].patternGroup = patternGroupNumber;

  findNeighbour(gameField, row + 1, col, patternGroupNumber);
  findNeighbour(gameField, row - 1, col, patternGroupNumber);
  findNeighbour(gameField, row, col + 1, patternGroupNumber);
  findNeighbour(gameField, row, col - 1, patternGroupNumber);
}

export function getPatternArea(fields: Field[][], patternIndex: number) {
  const min = { row: fields.length, col: fields[0].length };
  const max = { row: 0, col: 0 };

  for (const field of fields.flat()) {
    if (field.patternGroup === patternIndex) {
      min.row = min.row > field.index[0] ? field.index[0] : min.row;
      min.col = min.col > field.index[1] ? field.index[1] : min.col;
      max.row = max.row < field.index[0] ? field.index[0] : max.row;
      max.col = max.col < field.index[1] ? field.index[1] : max.col;
    }
  }

  return { min, max };
}

export function defineRotation() {
  // left croner
}
