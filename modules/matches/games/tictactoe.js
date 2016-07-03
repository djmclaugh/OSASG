var Board = require("./shared/board");
var Game = require("./game");

const EMPTY = 0;
const X = 1;
const O = 2;

// Tictactoe CLASS
function Tictactoe() {  
  this.resetGame();
}

Tictactoe.prototype = Object.create(Game.prototype);
Tictactoe.prototype.constructor = Tictactoe;

module.exports = Tictactoe;

Tictactoe.prototype.COLOUR_ENUM = {
  X: X,
  O: O,
  EMPTY: EMPTY
};

Tictactoe.prototype.resetGame = function(settings) {
  this.moves = [];
  this.board = new Board(3, 3, 3);
  this.settings = settings;
};

Tictactoe.prototype.initFromGameData = function(gameData) {
  this.resetGame();
  for (var i = 0; i < gameData.moves.length; ++i) {
    this.makeMove(gameData.moves[i]);
  }
};

Tictactoe.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  return gameData;
};

Tictactoe.prototype.getColourAt = function(position) {
  return this.board.getStateAtPosition(position);
};

Tictactoe.prototype.setColourAt = function(position, colour) {
  this.board.setStateAtPosition(position, colour);
};

// Checks if the move is valid.
// This is necessary since we might not know the origin of the move object.
Tictactoe.prototype.validateMove = function(move) {
  this.validateFormatOfMove(move);
  this.validateLegalityOfMove(move);
};

// We check if the move object follows the proper format.
// "move" should be a number from 0 to 8 representing which square has been played.
Tictactoe.prototype.validateFormatOfMove = function(move) {
  var expectedFormat = "A whole number from 0 to 8 inclusively";
  if (typeof move != "number") {
    throw new this.InvalidMoveFormatError(move, expectedFormat, "Received move is not a number");
  } else if (move % 1 != 0) {
    throw new this.InvalidMoveFormatError(move, expectedFormat, "Received move is not a whole number");
  } else if (!this.board.isValidPosition(move)) {
    throw new this.InvalidMoveFormatError(move, expectedFormat, "Received move is not a valid position");
  }
};

// We assume that the move object has the proper format.
Tictactoe.prototype.validateLegalityOfMove = function(move) {
  if (this.isOver()) {
    throw new this.IllegalMoveError(move, "No moves are legal since the game is already over");
  }
  if (this.getColourAt(move) != EMPTY) {
    throw new this.IllegalMoveError(move, "That position is already occupied");
  }
};

Tictactoe.prototype.getLegalMoves = function() {
  if (this.isOver()) {
    return [];
  }
  return this.board.getPositionsWithState(EMPTY);
};

Tictactoe.prototype.makeMove = function(move) {
  this.validateMove(move);
  this.setColourAt(move, this.moves.length % 2 == 0 ? X : O);
  this.moves.push(move);
};

Tictactoe.prototype.undoLastMove = function() {
  var move = this.moves.pop();
  this.setColourAt(move, EMPTY);
};

Tictactoe.prototype.getStatus = function() {
  if (this.getWinLine()) {
    return this.moves.length % 2 == 0 ? this.STATUS.P2_WIN : this.STATUS.P1_WIN;
  }
  if (this.moves.length == 9) {
    return this.STATUS.DRAW;
  }
  return this.moves.length % 2 == 0 ? this.STATUS.P1_TO_PLAY : this.STATUS.P2_TO_PLAY;
};

const possibleWins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

Tictactoe.prototype.getWinLine = function() {
  var self = this;
  
  function isWin(triple) {
    var colour = self.getColourAt(triple[0]);
    return colour != EMPTY && colour == self.getColourAt(triple[1]) && colour == self.getColourAt(triple[2]);
  }
  
  for (var i = 0; i < possibleWins.length; ++i) {
    var triple = possibleWins[i];
    if (isWin(triple)) {
      return triple;
    }
  }
  
  return null;
};

