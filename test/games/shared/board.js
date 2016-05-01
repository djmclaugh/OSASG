var assert = require("assert");
var Board = require("../../../modules/matches/games/shared/board.js");

describe("Board", function() {
  it("should detect invalid positions", function() {
    var b = new Board(3, 3, 2);
    assert.equal(b.isValidPosition(-5), false);
    assert.equal(b.isValidPosition(-1), false);
    assert.equal(b.isValidPosition(0), true);
    assert.equal(b.isValidPosition(5), true);
    assert.equal(b.isValidPosition(8), true);
    assert.equal(b.isValidPosition(9), false);
    assert.equal(b.isValidPosition(12), false);
    
    b = new Board(3, 2, 2);
    assert.equal(b.isValidPosition(-5), false);
    assert.equal(b.isValidPosition(-1), false);
    assert.equal(b.isValidPosition(0), true);
    assert.equal(b.isValidPosition(3), true);
    assert.equal(b.isValidPosition(5), true);
    assert.equal(b.isValidPosition(6), false);
    assert.equal(b.isValidPosition(12), false);
    
    b = new Board(2, 3, 2);
    assert.equal(b.isValidPosition(-5), false);
    assert.equal(b.isValidPosition(-1), false);
    assert.equal(b.isValidPosition(0), true);
    assert.equal(b.isValidPosition(3), true);
    assert.equal(b.isValidPosition(5), true);
    assert.equal(b.isValidPosition(6), false);
    assert.equal(b.isValidPosition(12), false);
  });

  it("should detect invalid coordinates", function() {
    var b = new Board(3, 3, 2);
    assert.equal(b.isValidCoordinate({x: 0, y: 0}), true);
    assert.equal(b.isValidCoordinate({x: 0, y: 1}), true);
    assert.equal(b.isValidCoordinate({x: 2, y: 0}), true);
    assert.equal(b.isValidCoordinate({x: 1, y: 2}), true);
    assert.equal(b.isValidCoordinate({x: 0, y: 4}), false);
    assert.equal(b.isValidCoordinate({x: 4, y: 0}), false);
    assert.equal(b.isValidCoordinate({x: 4, y: 4}), false);
    assert.equal(b.isValidCoordinate({x: 0, y: -1}), false);
    assert.equal(b.isValidCoordinate({x: -1, y: 0}), false);
    assert.equal(b.isValidCoordinate({x: -1, y: -1}), false);
  });

  it("should set and get the correct state", function() {
    var b = new Board(19, 19, 3);
    b.setStateAtPosition(31, 2);
    assert.equal(b.getStateAtPosition(31), 2);
  });

  it("should generate the correct string representation", function() {
    var b = new Board(3, 3, 3);
    b.setStateAtPosition(0, 1);
    assert.equal(b.toString(), "100\n000\n000\n"); 
    b.setStateAtPosition(1, 2);
    assert.equal(b.toString(), "120\n000\n000\n");
    b.setStateAtPosition(2, 0);
    assert.equal(b.toString(), "120\n000\n000\n");
    b.setStateAtPosition(3, 1);
    assert.equal(b.toString(), "120\n100\n000\n");
    b.setStateAtPosition(4, 2);
    assert.equal(b.toString(), "120\n120\n000\n");
    b.setStateAtPosition(5, 2);
    assert.equal(b.toString(), "120\n122\n000\n");
    b.setStateAtPosition(6, 2);
    assert.equal(b.toString(), "120\n122\n200\n");
    b.setStateAtPosition(7, 2);
    assert.equal(b.toString(), "120\n122\n220\n");
    b.setStateAtPosition(8, 2);
    assert.equal(b.toString(), "120\n122\n222\n");
    b.setStateAtPosition(4, 1);
    assert.equal(b.toString(), "120\n112\n222\n");
  });
});
