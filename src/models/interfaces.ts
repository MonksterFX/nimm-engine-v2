export interface Player {
  name: string;
}

export interface Move {
  player: Player;
  orientation: Orientation;
  position: [number, number];
}

export interface MoveInfo {
  moveId: string;
}

export interface GameOptions {
  // rows, cols
  size: [number, number];
}

export enum Orientation {
  TOP = 2,
  BOTTOM = -2,
  LEFT = 1,
  RIGHT = -1,
}
