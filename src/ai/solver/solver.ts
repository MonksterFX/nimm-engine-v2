import { GameState } from "../../models/gamestate"
import { Orientation } from "../../models/interfaces"

export type Move = {
    id: number;
    orientation: Orientation;
};

export abstract class Solver {
    abstract readonly name: string
    abstract readonly description: string

    abstract initialize(gameState: GameState): void;

    abstract bestMove(gameState: GameState, optimizeFor: 'win' | 'loss'): Move | null;

    abstract afterMove(move: any, gameState: GameState): void;
}