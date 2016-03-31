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

Tictactoe.prototype.copy = function() {
  var clone = new Tictactoe();
  clone.initFromGameData(this.generateGameData());
  return clone;
};

Tictactoe.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? this.PLAYER_ENUM.P1 : this.PLAYER_ENUM.P2;
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
  if (typeof move != "number" || move % 1 != 0 || !this.board.isValidPosition(move)) {
    throw new Error("'move'= " + JSON.stringify(move) + " is not a natural number from 0 to 8.");
  }
};

// We assume that the move object has the proper format.
Tictactoe.prototype.validateLegalityOfMove = function(move) {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    throw new Error("No moves are legal since the game is already over.");
  }
  if (this.getColourAt(move) != EMPTY) {
    throw new Error("'move'= " + JSON.stringify(move) + " is an already occupied position.");
  }
};

Tictactoe.prototype.getLegalMoves = function() {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    return {};
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
    return this.moves.length % 2 == 0 ? this.STATUS_ENUM.P2_WIN : this.STATUS_ENUM.P1_WIN;
  }
  if (this.moves.length == 9) {
    return this.STATUS_ENUM.DRAW;
  }
  return this.STATUS_ENUM.UNDECIDED;
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

