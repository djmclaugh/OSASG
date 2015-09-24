var assert = require("assert");
var Tictactoe = require("../modules/games.js").Tictactoe;

describe("Tictactoe", function() {
  beforeEach(function() {
    game = new Tictactoe({});
  });

  it("should throw an error if I try to play outside the board", function() {
    assert.throws(function() {
      game.makeMove({x: 3, y: 1});
    }, /'move' should follow the format {x, y} where x and y are 0, 1, or 2/);
  });
 
  it("should throw an error if I try to play in an non-empty position", function() {
    game.makeMove({x: 1, y: 1});
    assert.throws(function() {
      game.makeMove({x: 1, y: 1});
    }, /already occupied position/);
  });

  it("should be able to play a simple game", function() {
    game.makeMove({x: 0, y: 0});
    game.makeMove({x: 1, y: 0});
    game.makeMove({x: 0, y: 1});
    game.makeMove({x: 1, y: 1});
    game.makeMove({x: 0, y: 2});
    assert.equal(game.getStatus(), game.STATUS_ENUM.P1_WIN);
  });

  it("should be able to detect a draw", function() {
    game.makeMove({x: 0, y: 0});
    game.makeMove({x: 1, y: 1});
    game.makeMove({x: 0, y: 2});
    game.makeMove({x: 0, y: 1});
    game.makeMove({x: 2, y: 1});
    game.makeMove({x: 1, y: 0});
    game.makeMove({x: 1, y: 2});
    game.makeMove({x: 2, y: 2});
    game.makeMove({x: 2, y: 0});
    assert.equal(game.getStatus(), game.STATUS_ENUM.DRAW);
  });
});
