import { assert } from 'console';
import { randomUUID } from 'crypto';
import { BitTable } from '../utils/bittable';
import { Pattern, PatternSize, RotationDegree, Side } from '../utils/pattern';

const SIDES: Side[] = ['Top', 'Right', 'Bottom', 'Left'];

export class Graph {
  maxDepth: number = 1;
  root: Pattern;
  private map: Record<string, Pattern>;
  private leafs: Pattern[] = [];

  constructor(size: PatternSize) {
    this.root = new Pattern(BitTable.full(size));
    this.map = {};
    this.map[this.root.hash] = this.root;
  }

  static from(pattern: Pattern) {
    const graph = new Graph(pattern.size as PatternSize);
    graph.root = pattern;
    return graph;
  }

  get size() {
    return Object.keys(this.map).length;
  }

  getMap(): Record<string, Pattern> {
    return this.map;
  }

  getLeafNode(): Pattern {
    return Object.values(this.map).filter(
      (n) => n.getChildrens().length === 0
    )[0];
  }

  reset() {
    this.map = {};
    this.map[this.root.hash] = this.root;
    this.maxDepth = 0;
    this.leafs = [];
  }

  build(basePattern: Pattern = this.root, level = 0) {
    const nextLevelPatterns: Pattern[] = [];

    if (level > this.maxDepth) {
      this.maxDepth = level;
    }

    if (level === 100) {
      throw new Error(`maximum depth of ${level} reached`);
    }

    const timeLabel = `create tree - ${level} - ${randomUUID()}`;
    console.time(timeLabel);

    // play all possible mutations
    for (const side of SIDES.slice(0, 1)) {
      // play possible solutions in this step
      for (let row = 0; row < this.root.size; row++) {
        for (let col = 0; col < this.root.size; col++) {
          // step 1: create pattern
          const newPattern = basePattern.copy().removeTo(row, col, side);

          // if nothing changed
          if (newPattern.hash !== basePattern.hash) {
            // store in this level
            nextLevelPatterns.push(newPattern);
          }
        }
      }
    }

    console.timeEnd(timeLabel);

    // decide for each pattern to go deeper
    for (const pattern of nextLevelPatterns) {
      // go level deeper if path is not known already
      if (!this.map[pattern.hash]) {
        // add object to pattern map
        this.map[pattern.hash] = pattern;
        this.build(pattern, level + 1);
      }

      // add reference to parent
      basePattern.addChild(this.map[pattern.hash]);
      this.map[pattern.hash].addParent(basePattern);
    }
  }
}
