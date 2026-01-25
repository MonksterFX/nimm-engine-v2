import assert from "node:assert";
import { describe, it } from "node:test";
import { GameState } from "../../dist/models/gamestate";
import { Orientation } from "../../dist/models/interfaces";

const orientations = [
  Orientation.TOP,
  Orientation.BOTTOM,
  Orientation.LEFT,
  Orientation.RIGHT,
];

describe("GameState", () => {
  describe("initialization", () => {
    it("should be able to create a new game state", () => {
      const gameState = new GameState();
      assert.ok(gameState, "gameState should be defined");
    });

    describe("invalid initialization", () => {
      it("should throw an error if the size is 0", () => {
        const gameState = new GameState();
        assert.throws(
          () => gameState.init({ size: [0, 0] }),
          "should throw an error if the size is 0x0",
        );
      });
    });
  });

  it("should be able to initialize a game state with different sizes", () => {
    const gameState = new GameState();
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        gameState.init({ size: [row, col] });
        assert.strictEqual(
          gameState.rows.length,
          row,
          `gameState should have ${row} rows`,
        );
        assert.strictEqual(
          gameState.columns.length,
          col,
          `gameState should have ${col} columns`,
        );
      }
    }
  });
});

describe("making moves", () => {
  describe("invalid moves", () => {
    it("should not be able to take a stone from different sides by row, column indices and orientation in an finished game", () => {
      for (let orientation of orientations) {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });
        assert.throws(
          () => gameState.take(0, 0, orientation),
          "should throw an error",
        );
      }
    });

    it("should not be able to take a stone from different sides by id and orientation in a finished game", () => {
      for (let orientation of orientations) {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });
        assert.throws(
          () => gameState.takeById(0, orientation),
          "should throw an error",
        );
      }
    });
  });

  describe("valid moves", () => {
    it("player should change after a valid move", () => {
      const gameState = new GameState();
      gameState.init({ size: [2, 1] });
      assert.strictEqual(gameState.getCurrentPlayer(), 0);
      gameState.take(0, 0, Orientation.LEFT);
      assert.strictEqual(gameState.getCurrentPlayer(), 1);
    });

    it("player should not change after an invalid move", () => {
      const gameState = new GameState();
      gameState.init({ size: [1, 1] });
      assert.strictEqual(gameState.getCurrentPlayer(), 0);
      assert.throws(
        () => gameState.take(0, 0, Orientation.LEFT),
        "should throw an error",
      );
      assert.strictEqual(gameState.getCurrentPlayer(), 0);
    });

    it("finishing the game should change the current player to the losing player and the game should be finished", () => {
      let gameState = new GameState();
      gameState.init({ size: [2, 1] });

      const validMoves = gameState.getAllValidMoves();
      assert.strictEqual(validMoves.length, 6, "should have 6 valid moves");

      for (let move of validMoves) {
        // reset game state
        gameState = new GameState();
        gameState.init({ size: [2, 1] });

        assert.strictEqual(
          gameState.getCurrentPlayer(),
          0,
          "player 0 should be the current player",
        );

        assert.strictEqual(
          gameState.isFinished(),
          false,
          "game should not be finished",
        );

        gameState.takeById(move.id, move.orientation);

        assert.strictEqual(
          gameState.getCurrentPlayer(),
          1,
          "player 1 should be the current player",
        );

        assert.strictEqual(
          gameState.isFinished(),
          true,
          "game should be finished",
        );
      }
    });
  });

  describe("validating moves", () => {
    describe("invalid moves", () => {
      it("should be able to validate a move by row, column indices and orientation", () => {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });

        for (let orientation of orientations) {
          assert.strictEqual(
            gameState.isValidMove(0, 0, orientation),
            false,
            `${Orientation[orientation]} should be invalid`,
          );
        }
      });

      it("should be able to validate a move by id and orientation", () => {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });

        for (let orientation of orientations) {
          assert.strictEqual(
            gameState.isValidMoveByIndex(0, orientation),
            false,
            `${Orientation[orientation]} should be invalid`,
          );
        }
      });
    });
  });

  describe("utility functions", () => {
    describe(".getAllValidMoves", () => {
      it("should not return any valid moves in a finished game", () => {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });
        assert.strictEqual(
          gameState.getAllValidMoves().length,
          0,
          "should have 0 valid moves",
        );
      });

      it("should return all valid moves in an brand new game", () => {
        const gameState = new GameState();
        gameState.init({ size: [2, 2] });

        assert.strictEqual(
          gameState.getAllValidMoves().length,
          16,
          "should have 16 valid moves",
        );
      });
    });

    describe(".getValidMoves", () => {
      it("should not return any valid moves in a finished game", () => {
        const gameState = new GameState();
        gameState.init({ size: [1, 1] });

        for (let orientation of orientations) {
          assert.strictEqual(
            gameState.getValidMoves(orientation).length,
            0,
            `${Orientation[orientation]} should have 0 valid moves`,
          );
        }
      });

      it("should return all valid moves in an brand new game", () => {
        const gameState = new GameState();
        gameState.init({ size: [2, 2] });

        for (let orientation of orientations) {
          assert.strictEqual(
            gameState.getValidMoves(orientation).length,
            4,
            `${Orientation[orientation]} should have 4 valid moves`,
          );
        }
      });
    });

    describe(".clone", () => {
      it("should create a deep copy of the game state", () => {
        const gameState = new GameState();

        // make it easy to test by initializing with a small size
        gameState.init({ size: [1, 1] });

        // clone the game state
        const clone = gameState.clone();

        assert.notStrictEqual(
          gameState,
          clone,
          "clone should create a new game state object",
        );

        // check if the clone has the same attributes as the game state
        const attributes = ["rows", "columns"];
        for (let attribute of attributes) {
          assert.notStrictEqual(
            gameState[attribute],
            clone[attribute],
            `clone should create a new [object] or [array] ${attribute} `,
          );
        }

        // check if fields are deep copied
        assert.notStrictEqual(
          gameState.getById(0),
          clone.getById(0),
          "clone should create a new field object",
        );
      });
    });
  });
});
