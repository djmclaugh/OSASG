var assert = require("assert");
var Connect6 = require("../modules/games.js").Connect6;

describe("Connect6", function() {
  beforeEach(function() {
    game = new Connect6({});
  });

  it("should throw an error if I try to place a stone outside the board", function() {
    assert.throws(function() {
      game.makeMove({p1:{x: 20, y: 12}});
    }, /is not a position on the 19 by 19 board/);
  });
 
  it("should throw an error if I try to place two stones on the first turn", function() {
    assert.throws(function() {
      game.makeMove({p1:{x: 0, y: 0}, p2:{x: 1, y: 1}});
    }, /can only place a single stone/);
  });

  it("should throw an error if I try to place only one stone NOT on the first turn", function() {
    game.makeMove({p1:{x: 3, y: 5}});
    assert.throws(function() {
      game.makeMove({p1:{x: 2, y: 3}});
    }, /must place two stones/);
  });

  it("should throw an error if I try to place a stone in an non-empty position", function() {
    game.makeMove({p1:{x: 5, y: 2}});
    assert.throws(function() {
      game.makeMove({p1:{x: 5, y: 2}, p2:{x: 1, y: 1}});
    }, /already occupied position/);
  });

  it("should be able to play a simple game", function() {
    game.makeMove({p1:{x: 0, y: 0}});
    game.makeMove({p1:{x: 1, y: 0}, p2:{x: 1, y: 1}});
    game.makeMove({p1:{x: 0, y: 1}, p2:{x: 2, y: 2}});
    game.makeMove({p1:{x: 1, y: 2}, p2:{x: 1, y: 3}});
    game.makeMove({p1:{x: 0, y: 3}, p2:{x: 2, y: 4}});
    game.makeMove({p1:{x: 1, y: 4}, p2:{x: 1, y: 5}});
    assert.equal(game.getStatus(), game.STATUS_ENUM.P2_WIN);
  });

  // game taken from http://java.csie.nctu.edu.tw/~icwu/connect6/connect6.html#Ref_record
  it("should be able to play a full game", function() {
    game.makeMove({p1:{x: 9 , y: 9 }});
    game.makeMove({p1:{x: 9 , y: 10}, p2:{x: 9 , y: 8 }});
    game.makeMove({p1:{x: 10, y: 10}, p2:{x: 8 , y: 8 }});
    game.makeMove({p1:{x: 6 , y: 6 }, p2:{x: 12, y: 12}});
    game.makeMove({p1:{x: 10, y: 8 }, p2:{x: 8 , y: 10}});
    game.makeMove({p1:{x: 10, y: 9 }, p2:{x: 8 , y: 9 }});
    game.makeMove({p1:{x: 11, y: 7 }, p2:{x: 11, y: 6 }});
    game.makeMove({p1:{x: 7 , y: 11}, p2:{x: 12, y: 6 }});
    game.makeMove({p1:{x: 11, y: 9 }, p2:{x: 11, y: 8 }});
    game.makeMove({p1:{x: 11, y: 10}, p2:{x: 11, y: 5 }});
    game.makeMove({p1:{x: 12, y: 8 }, p2:{x: 13, y: 7 }});
    game.makeMove({p1:{x: 9 , y: 11}, p2:{x: 15, y: 5 }});
    game.makeMove({p1:{x: 9 , y: 7 }, p2:{x: 8 , y: 6 }});
    game.makeMove({p1:{x: 13, y: 11}, p2:{x: 7 , y: 5 }});
    game.makeMove({p1:{x: 8 , y: 7 }, p2:{x: 10, y: 7 }});
    game.makeMove({p1:{x: 7 , y: 7 }, p2:{x: 12, y: 7 }});
    game.makeMove({p1:{x: 9 , y: 6 }, p2:{x: 8 , y: 5 }});
    game.makeMove({p1:{x: 7 , y: 4 }, p2:{x: 8 , y: 4 }});
    game.makeMove({p1:{x: 13, y: 10}, p2:{x: 12, y: 9 }});
    assert.equal(game.getStatus(), game.STATUS_ENUM.P1_WIN);
  });
});
