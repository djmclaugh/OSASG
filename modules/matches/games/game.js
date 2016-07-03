function Game() {}

Game.prototype.STATUS = {
  P1_TO_PLAY: "P1_TO_PLAY",
  P2_TO_PLAY: "P2_TO_PLAY",
  P1_WIN: "P1_WIN",
  P2_WIN: "P2_WIN",
  DRAW: "DRAW"
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
  var copy = new this.constructor();
  copy.initFromGameData(this.generateGameData());
  return copy;
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

Game.prototype.isOver = function() {
  status = this.getStatus();
  return status == this.STATUS.P1_WIN || status == this.STATUS.P2_WIN || status == this.STATUS.DRAW
};

module.exports = Game;
