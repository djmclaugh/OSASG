var assert = require("assert");
var Connect6 = require("../../modules/games.js").Connect6;

describe("Connect6", function() {
  beforeEach(function() {
    game = new Connect6({});
  });

  it("should throw an error if I try to place a stone outside the board", function() {
    assert.throws(function() {
      game.makeMove([-1]);
    }, game.InvalidMoveError);
    assert.throws(function() {
      game.makeMove([361]);
    }, game.InvalidMoveError);
  });
  
  it("should throw an error if I try to play at the same place twice in a single move", function() {
    game.makeMove([0]);
    assert.throws(function() {
      game.makeMove([1, 1]);
    }, game.InvalidMoveError);
  });
 
  it("should throw an error if I try to place two stones on the first turn", function() {
    assert.throws(function() {
      game.makeMove([0, 1]);
    }, game.IllegalMoveError);
  });

  it("should throw an error if I try to place only one stone NOT on the first turn", function() {
    game.makeMove([0]);
    assert.throws(function() {
      game.makeMove([1]);
    }, game.IllegalMoveError);
  });

  it("should throw an error if I try to place a stone in an non-empty position", function() {
    game.makeMove([0]);
    assert.throws(function() {
      game.makeMove([0, 1]);
    }, game.IllegalMoveError);
    assert.throws(function() {
      game.makeMove([1, 0]);
    }, game.IllegalMoveError);
  });

  it("should be able to play a simple game", function() {
    game.makeMove([0]);
    game.makeMove([19, 20]);
    game.makeMove([1, 2]);
    game.makeMove([21, 22]);
    game.makeMove([3, 4]);
    game.makeMove([23, 24]);
    assert.equal(game.getStatus(), game.STATUS_ENUM.P2_WIN);
  });

  // game taken from http://java.csie.nctu.edu.tw/~icwu/connect6/connect6.html#Ref_record
  it("should be able to play a full game", function() {
    game.makeMove([180]);
    game.makeMove([199, 161]);
    game.makeMove([200, 160]);
    game.makeMove([120, 240]);
    game.makeMove([162, 198]);
    game.makeMove([181, 179]);
    game.makeMove([144, 125]);
    game.makeMove([216, 126]);
    game.makeMove([182, 163]);
    game.makeMove([201, 106]);
    game.makeMove([170, 146]);
    game.makeMove([218, 110]);
    game.makeMove([142, 122]);
    game.makeMove([222, 102]);
    game.makeMove([141, 143]);
    game.makeMove([140, 145]);
    game.makeMove([123, 103]);
    game.makeMove([ 83,  84]);
    game.makeMove([203, 183]);
    assert.equal(game.getStatus(), game.STATUS_ENUM.P1_WIN);
  });
});

