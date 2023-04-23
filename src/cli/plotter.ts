import { findPatterns, getPatternArea } from '../engine/pattern.js';
import { Field } from '../models/field.js';

function plotField(gameField: Field[][]) {
  const plot = gameField.map((row) => row.map((field) => field.state));
  console.table(plot);
}

function plotPattern(gameField: Field[][], plotPatterns = false) {
  // update patterns before printing
  const numberOfPatterns = findPatterns(gameField);

  // create and print pattern log
  const plot = gameField.map((row) =>
    row.map((field) => {
      return field.patternGroup > -1 ? field.patternGroup : 0;
    })
  );

  console.table(plot);

  if (plotPatterns) {
    for (let pi = 1; pi <= numberOfPatterns; pi++) {
      const area = getPatternArea(gameField, pi);
      const pattern = gameField
        .slice(area.min.row, area.max.row + 1)
        .map((row) => row.slice(area.min.col, area.max.col + 1));

      console.log(`Pattern Number ${pi}`);
      console.table(pattern.map((row) => row.map((c) => c.state)));
    }
  }
}

export default {
  field: plotField,
  pattern: plotPattern,
};
