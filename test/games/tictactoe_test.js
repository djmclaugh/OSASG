var assert = require("assert");
var Tictactoe = require("../../modules/games/tictactoe");

describe("Tictactoe", function() {
  beforeEach(function() {
    game = new Tictactoe({});
  });

  it("should throw an error if I try to play outside the board", function() {
    assert.throws(function() {
      game.makeMove(10);
    }, /is not a natural number from 0 to 8/);
  });
 
  it("should throw an error if I try to play in an non-empty position", function() {
    game.makeMove(4);
    assert.throws(function() {
      game.makeMove(4);
    }, /already occupied position/);
  });

  it("should be able to play a simple game", function() {
    game.makeMove(0);
    game.makeMove(1);
    game.makeMove(3);
    game.makeMove(4);
    game.makeMove(6);
    assert.equal(game.getStatus(), game.STATUS_ENUM.P1_WIN);
  });

  it("should be able to detect a draw", function() {
    game.makeMove(0);
    game.makeMove(4);
    game.makeMove(6);
    game.makeMove(3);
    game.makeMove(5);
    game.makeMove(1);
    game.makeMove(7);
    game.makeMove(8);
    game.makeMove(2);
    assert.equal(game.getStatus(), game.STATUS_ENUM.DRAW);
  });
});
