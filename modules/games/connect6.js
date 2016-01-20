var Game = require("./game");
var Board = require("./shared/board");
var Line = require("./shared/line");

// Colours
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function Connect6() {
  this.resetGame();
}

Connect6.prototype = Object.create(Game.prototype);
Connect6.prototype.constructor = Connect6;

Connect6.prototype.COLOUR_ENUM = {
  EMPTY: EMPTY,
  BLACK: BLACK,
  WHITE: WHITE
};

Connect6.prototype.resetGame = function() {
  this.moves = [];
  this.board = new Board(19, 19, 3);
};

Connect6.prototype.initFromGameData = function(gameData) {
  this.resetGame();
  for (var i = 0; i < gameData.moves.length; ++i) {
    this.makeMove(gameData.moves[i]);
  }
};

Connect6.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  return gameData;
};

Connect6.prototype.copy = function() {
  var clone = new Connect6();
  clone.initFromGameData(this.generateGameData());
  return clone;
};

Connect6.prototype.getColourAtPosition = function(position) {
  return this.board.getStateAtPosition(position);
};

Connect6.prototype.getColourAtCoordinate = function(coordinate) {
  return this.board.getStateAtCoordinate(coordinate);
};

Connect6.prototype.isOnBoard = function(coordinate) {
  return this.board.isValidCoordinate(coordinate);
};

Connect6.prototype.getColourToPlay = function() {
  return this.moves.length % 2 == 0 ? BLACK : WHITE;
};

Connect6.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? this.PLAYER_ENUM.P1 : this.PLAYER_ENUM.P2;
};

// Checks if the move is valid.
// This is necessary since we do not know the origin of the move object.
Connect6.prototype.validateMove = function(move) {
  this.validateFormatOfMove(move);
  this.validateLegalityOfMove(move);
};

// We check if the move object follows the proper format.
// 'move' should be an array of distinct integers from [0, 19*19) with length 1 or 2.
Connect6.prototype.validateFormatOfMove = function(move) {
  var format = "an array of distinct integers from [0, 19*19) with length 1 or 2.";
  if (!Array.isArray(move)) {
    throw new this.InvalidMoveFormatError(move, format, "Received move is not an array.");
  }
  if (move.length != 1 && move.length != 2) {
    throw new this.InvalidMoveFormatError(move, format, "Received move should have length 1 or 2.");
  }
  if (move.length == 2 && move[0] == move[1]) {
    throw new this.InvalidMoveFormatError(move, format,
        "Received move should contain distinct entries.");
  }
  for (var i = 0; i < move.length; ++i) {
    var m = move[i];
    if (typeof m != "number" || m % 1 != 0 || !this.board.isValidPosition(m)) {
      throw new this.InvalidMoveFormatError(move, format,
          "Received move should only contain integers from [0, 19*19).");
    }
  }
};

// We assume that the move object has the proper format.
Connect6.prototype.validateLegalityOfMove = function(move) {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    throw new this.IllegalMoveError(move, "No moves are legal since the game is already over.");
  }
  if (this.moves.length == 0 && move.length != 1) {
    throw new this.IllegalMoveError(move,
        "The first move of the game should contain exactly one position.");
  }
  if (this.moves.length != 0 && move.length != 2) {
    throw new this.IllegalMoveError(move,
        "Exept for the first move of the game, every move should contain exactly two positions.");
  }
  for (var i = 0; i < move.length; ++i) {
    var m = move[i];
    if (this.board.getStateAtPosition(m) != EMPTY) {
      throw new this.IllegalMoveError(move,
          "'move[" + i + "]' = " + m + " is an already occupied position.");
    }
  }
};

Connect6.prototype.getLegalMoves = function() {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    return [];
  }
  var openSpots = this.board.getPositionsWithState(EMPTY);
  if (this.moves.length == 0) {
    return openSpots.map(function(spot) {
      return [spot];
    });
  }
  var legalMoves = [];
  for (var i = 0; i < openSpots.length; ++i) {
    for (var j = i + 1; j < openSpots.length; ++j) {
      legalMoves.push([openSpots[i], openSpots[j]]);
    }
  }
  return legalMoves;
};

Connect6.prototype.makeMove = function(move) {
  this.validateMove(move);
  for (var i = 0; i < move.length; ++i) {
    this.board.setStateAtPosition(move[i], this.getColourToPlay());
  }
  this.moves.push(move);
};

// Returns the undone move.
Connect6.prototype.undoLastMove = function() {
  if (this.moves.length === 0) {
    return;
  }
  var move = this.moves.pop();
  for (var i = 0; i < move.length; ++i) {
    this.board.setStateAtPosition(move[i], EMPTY);
  }
  return move;
};

Connect6.prototype.getStatus = function() {
  if (this.didLastMoveWin()) {
    return this.moves.length % 2 == 0 ? this.STATUS_ENUM.P2_WIN : this.STATUS_ENUM.P1_WIN;
  }
  if (2 * this.moves.length - 1 >= this.board.N) {
    return this.STATUS_ENUM.DRAW;
  }
  return this.STATUS_ENUM.UNDECIDED;
};

Connect6.prototype.willMoveWin = function(move, colour) {
  for (var i = 0; i < move.length; ++i) {
    if (this.board.getStateAtPosition(i) != EMPTY) {
      return false;
    }
  }
  for (var i = 0; i < move.length; ++i) {
    this.board.setStateAtPosition(move[i], colour);
  }
  var result = false;
  for (var i = 0; i < move.length; ++i) {
    if (this.getLongestLineAtPosition(move[i]).getLength() >= 6) {
      result = true;
      break;
    }
  }
  for (var i = 0; i < move.length; ++i) {
    this.board.setStateAtPosition(move[i], EMPTY);
  }
  return result;
};

Connect6.prototype.didLastMoveWin = function() {
  // It is impossible for the game to end in less than 6 moves.
  // This check guarantees that the last move placed 2 stones.
  if (this.moves.length < 6) {
    return false;
  }
  var lastMove = this.moves[this.moves.length - 1];
  if (this.getLongestLineAtPosition(lastMove[0]).getLength() >= 6) {
    return true;
  }
  if (this.getLongestLineAtPosition(lastMove[1]).getLength() >= 6) {
    return true;
  }
  return false;
};

Connect6.prototype.getWinLine = function() {
  for (var i = this.moves.length - 1; i > 1; --i) {
    var line = this.getLongestLineAtPosition(this.moves[i][0]);
    if (line.getLength() >= 6) {
      return line;
    }
    line = this.getLongestLineAtPosition(this.moves[i][1]);
    if (line.getLength() >= 6) {
      return line;
    }
  }
  return null;
};

Connect6.prototype.getLongestLineAtPosition = function(position) {
  var self = this;
  var colour = this.board.getStateAtPosition(position);
  if (colour == EMPTY) {
    return null;
  }
  
  var coordinate = this.board.positionToCoordinate(position);
  
  function lineEnd(start, direction) {
    var nextCoordinate = {x: start.x + direction.x, y: start.y + direction.y};
    while (self.board.isValidCoordinate(nextCoordinate)
        && self.board.getStateAtCoordinate(nextCoordinate) == colour) {
      nextCoordinate.x += direction.x;
      nextCoordinate.y += direction.y;
    }
    return {x: nextCoordinate.x - direction.x, y: nextCoordinate.y - direction.y};
  }
  
  function getLine(coordinate, direction) {
    var start = lineEnd(coordinate, {x: -direction.x, y: -direction.y});
    var end = lineEnd(coordinate, direction);
    return new Line(start, end);
  }
  
  var line;
  var longestLine = new Line(coordinate, coordinate);
  
  // Horizontal check
  line = getLine(coordinate, {x: 1, y: 0});
  if (line.getLength() > longestLine.getLength()) {
    longestLine = line;
  }
  
  // Vertical check
  line = getLine(coordinate, {x: 0, y: 1});
  if (line.getLength() > longestLine.getLength()) {
    longestLine = line;
  }
  
  // x = y check
  line = getLine(coordinate, {x: 1, y: 1});
  if (line.getLength() > longestLine.getLength()) {
    longestLine = line;
  }
  
  // x = -y check
  line = getLine(coordinate, {x: 1, y: -1});
  if (line.getLength() > longestLine.getLength()) {
    longestLine = line;
  }
  
  return longestLine;
};

module.exports = Connect6;
