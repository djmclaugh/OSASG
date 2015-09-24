(function(exports){

// Status results
const UNDECIDED = "GAME_STATUS_UNDECIDED";
const P1_WIN = "GAME_STATUS_P1_WIN";
const P2_WIN = "GAME_STATUS_P2_WIN";
const DRAW = "GAME_STATUS_DRAW";

function Game() {}

Game.prototype.STATUS_ENUM = {
  UNDECIDED: UNDECIDED,
  P1_WIN: P1_WIN,
  P2_WIN: P2_WIN,
  DRAW: DRAW
};
  
Game.prototype.initWithGameData = function(gameData) {
  throw new Error("This method needs to be implemented by subclass.");
};

Game.prototype.generateGameData = function() {
  throw new Error("This method needs to be implemented by subclass.");
};

Game.prototype.makeMove = function(move) {
  throw new Error("This method needs to be implemented by subclass.");
};

Game.prototype.getStatus = function() {
  throw new Error("This method needs to be implemented by subclass.");
};

exports.Game = Game;

})(typeof exports == 'undefined' ? this['OSASG'] : exports);