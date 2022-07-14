import { BitTable } from '../utils/bittable';
import { Pattern, PatternSize, RotationDegree } from '../utils/pattern';

export class Tree {
  readonly root: Pattern;
  private map: Record<string, Pattern> = {};

  constructor(size: PatternSize) {
    this.root = new Pattern(BitTable.full(size));
  }

  buildTree() {
    let lastRotation = this.root;
    this.map = {};

    console.time('create tree');

    // play all possible mutations
    for (let rotationIndex = 0; rotationIndex < 4; rotationIndex++) {
      if (rotationIndex > 0) {
        lastRotation = lastRotation.getRotated();
      }

      for (let row = 0; row < this.root.size; row++) {
        for (let col = 0; col < this.root.size; col++) {
          // step 1: create pattern
          const newPattern = lastRotation.copy().removeTo(row, col);

          // step 2: check if allready existing
          if (this.map[newPattern.hash]) continue;

          // step 3: add rotating patterns
          this.map[newPattern.hash] = newPattern;

          for (const rotation of [
            '90deg',
            '180deg',
            '270deg',
          ] as RotationDegree[]) {
            const rotated = newPattern.getRotated(rotation);
            rotated.addBasePattern(newPattern);

            if (!this.map[rotated.hash]) {
              this.map[rotated.hash] = rotated;
            }
          }
        }
      }
    }

    console.log(Object.keys(this.map).length);
    console.timeEnd('create tree');
  }
}
