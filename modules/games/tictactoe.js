var Game = require("./game");

const X = 1;
const O = 2;
const EMPTY = 3;

// Boards are stored as binary numbers where a 1 at index i means that there is a token at
// position i on the board.
//
// The board positions are as follows:
// 0 1 2
// 3 4 5
// 6 7 8
//
// So:
// X - -
// X - X == 000101001 == 41
// - - -

const FULL_BOARD = 511;

const TOP_ROW = 7;
const MIDDLE_ROW = 56;
const BOTTOM_ROW = 448
const LEFT_COLUMN = 73;
const MIDDLE_COLUMN = 146;
const RIGHT_COLUMN = 292;
const DIAGONAL_1 = 84;
const DIAGONAL_2 = 273;

const LINES = [
  TOP_ROW,
  MIDDLE_ROW,
  BOTTOM_ROW,
  LEFT_COLUMN,
  MIDDLE_COLUMN,
  RIGHT_COLUMN,
  DIAGONAL_1,
  DIAGONAL_2
];


// Tictactoe CLASS
function Tictactoe(settings) {  
  this.moves = [];
  this.boardX = 0;
  this.boardO = 0;
  this.settings = settings;
}

Tictactoe.prototype = Object.create(Game.prototype);
Tictactoe.prototype.constructor = Tictactoe;

module.exports = Tictactoe;

function boardToArrayOfPositions(board) {
  var result =[];
  for (var i = 0; i < 9; ++i) {
    if (board & Math.pow(2, i)) {
      result.push(i);
    }
  }
  return result;
}

function invertedBoard(board) {
  return board ^ FULL_BOARD;
}

Tictactoe.prototype.COLOUR_ENUM = {
  X: X,
  O: O,
  EMPTY: EMPTY
};

Tictactoe.prototype.LINES = LINES;

Tictactoe.prototype.initFromGameData = function(gameData) {
  this.moves = gameData.moves;
  this.boardX = gameData.boardX;
  this.boardO = gameData.boardO;
  this.settings = gameData.settings;
};

Tictactoe.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  gameData.boardX = this.boardX;
  gameData.boardO = this.boardO;
  gameData.settings = this.settings;
  return gameData;
};

Tictactoe.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? this.PLAYER_ENUM.P1 : this.PLAYER_ENUM.P2;
}

Tictactoe.prototype.getColourAt = function(position) {
  var mask = Math.pow(2, position);
  if (mask & this.boardX) {
    return X;
  }
  if (mask & this.boardO) {
    return O;
  }
  return EMPTY;
};

Tictactoe.prototype.setColourAt = function(position, colour) {
  var mask = Math.pow(2, position);
  var removeMask = invertedBoard(mask);
  if (colour == X) {
    this.boardX |= mask;
    this.boardO &= removeMask;
  } else if (colour == O) {
    this.boardX &= removeMask;
    this.boardO |= mask;
  } else {
    this.boardX &= removeMask;
    this.boardO &= removeMask;
  }
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
  if (move !== 0 && move !== 1 && move !== 2 && move !== 3 && move !== 4
    && move !== 5 && move !== 6 && move !== 7 && move !==8) {
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

Tictactoe.prototype.getWinLine = function() {
  for (var i = 0; i < LINES.length; ++i) {
    var line = LINES[i];
    if ((this.boardX & line) == line || (this.boardO & line) == line) {
      return boardToArrayOfPositions(line);
    }
  }
};

