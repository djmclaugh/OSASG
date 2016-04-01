var assert = require("assert");
var Hex = require("../../modules/games/hex");

describe("Hex", function() {
  var game;

  beforeEach(function() {
    game = new Hex({size:3});
  });

  it("should throw an error if I try to play outside the board", function() {
    assert.throws(function() {
      game.makeMove(10);
    }, game.InvalidMoveFormatError);
    assert.throws(function() {
      game.makeMove(-2);
    }, game.InvalidMoveFormatError);
    game = new Hex({size:4});
    assert.throws(function() {
      game.makeMove(16);
    }, game.InvalidMoveFormatError);
  });
 
  it("should throw an error if I try to play in an non-empty position", function() {
    game.makeMove(4);
    game = game.copy();
    assert.throws(function() {
      game.makeMove(4);
    }, game.IllegalMoveError);
  });

  it("should throw an error if I try to swap not on the second turn", function() {
    assert.throws(function() {
      game.makeMove(-1);
    }, game.InvalidMoveError);
    game.makeMove(5);
    game.makeMove(6);
    assert.throws(function() {
      game.makeMove(-1);
    }, game.IllegalMoveError);
  });

  it("should swap properly", function() {
    game.makeMove(1);
    game.makeMove(-1);
    assert.equal(game.getColourAt(1), game.COLOUR_ENUM.EMPTY);
    assert.equal(game.getColourAt(3), game.COLOUR_ENUM.BLUE);

    game = new Hex({size:11});
    game.makeMove(107);
    game.makeMove(-1);
    assert.equal(game.getColourAt(107), game.COLOUR_ENUM.EMPTY);
    assert.equal(game.getColourAt(97), game.COLOUR_ENUM.BLUE);
  });

  it("should be able to play a simple games", function() {
    game.makeMove(0);
    game.makeMove(1);
    game.makeMove(3);
    game.makeMove(4);
    game.makeMove(6);
    game.makeMove(7);
    assert.equal(game.getStatus(), game.STATUS_ENUM.P2_WIN);

    game = new Hex({size:5});
    game.makeMove(3);
    game.makeMove(-1);
    game.makeMove(4);
    game.makeMove(8);
    game.makeMove(23);
    game.makeMove(12);
    game.makeMove(7);
    game.makeMove(17);
    game.makeMove(22);
    game.makeMove(19);
    game.makeMove(2);
    game.makeMove(0);
    game.makeMove(21);
    game.makeMove(11);
    game.makeMove(13);
    game.makeMove(20);
    game.makeMove(3);
    game.makeMove(9);
    game.makeMove(10);
    game.makeMove(1);
    game.makeMove(5);
    game.makeMove(6);
    assert.equal(game.getStatus(), game.STATUS_ENUM.P2_WIN);
  });
});

