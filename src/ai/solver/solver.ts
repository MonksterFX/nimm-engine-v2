import { GameState } from "../../models/gamestate.js"
import { Orientation } from "../../models/interfaces.js"

export type Move = {
    id: number;
    orientation: Orientation;
};

export abstract class Solver {
    abstract readonly name: string
    abstract readonly description: string

    abstract initialize(gameState: GameState, optimizeForPlayer: number): void;

    abstract update(gameState: GameState): void;

    abstract bestMove(optimizeForPlayer: number): Move | null;
}