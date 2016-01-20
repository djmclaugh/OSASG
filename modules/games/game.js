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

function InvalidMoveFormatError(move, expectedFormat, reason) {
  this.message = "Invalid move format!\nReceived: " + JSON.stringify(move) + "\nExpected: " + expectedFormat;
  if (reason) {
    this.message += "\n" + reason;
  }
  this.stack = (new Error()).stack;
}
InvalidMoveFormatError.prototype = Object.create(Error.prototype);
Game.prototype.InvalidMoveFormatError = InvalidMoveFormatError;

function IllegalMoveError(move, reason) {
  this.message = "Illegal move!\nReceived: " + JSON.stringify(move);
  if (reason) {
    this.message += "\n" + reason;
  }
  this.stack = (new Error()).stack;
}
IllegalMoveError.prototype = Object.create(Error.prototype);
Game.prototype.IllegalMoveError = IllegalMoveError;
  
Game.prototype.initFromGameData = function(gameData) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.generateGameData = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.copy = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.whosTurnIsIt = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.getLegalMoves = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.undoLastMove = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.makeMove = function(move) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.getStatus = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

module.exports = Game;
