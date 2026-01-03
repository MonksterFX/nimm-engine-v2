import { Orientation } from "../../models/interfaces";

export function convertOrientation(orientation: Orientation): string {
    switch(orientation) {
      case Orientation.TOP:
        return 'TOP';
      case Orientation.BOTTOM:
        return 'BOTTOM';
      case Orientation.LEFT:
        return 'LEFT';
      case Orientation.RIGHT:
        return 'RIGHT';
      default:
        return 'UNKNOWN';
    }
  }