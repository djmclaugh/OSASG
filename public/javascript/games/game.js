(function(exports) {

function Game() {}

Game.prototype.PLAYER_ENUM = {
  P1: "GAME_PLAYER_P1",
  P2: "GAME_PLAYER_P2"
};

Game.prototype.STATUS_ENUM = {
  UNDECIDED: "GAME_STATUS_UNDECIDED",
  P1_WIN: "GAME_STATUS_P1_WIN",
  P2_WIN: "GAME_STATUS_P2_WIN",
  DRAW: "GAME_STATUS_DRAW"
};
  
Game.prototype.initWithGameData = function(gameData) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.generateGameData = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.whosTurnIsIt = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.makeMove = function(move) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.getStatus = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

exports.Game = Game;

})(typeof exports == 'undefined' ? this['OSASG'] : exports);