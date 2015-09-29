var Game = require("./game");

const X = Game.prototype.PLAYER_ENUM.P1;
const O = Game.prototype.PLAYER_ENUM.P2;
const EMPTY = "EMPTY";
const WIDTH = 3;
const HEIGHT = 3;

// Tictactoe CLASS
function Tictactoe(settings) {  
  this.moves = [];
  this.board = [];
  this.settings = settings;
  
  for (var i = 0; i < WIDTH; ++i) {
    this.board[i] = [];
    for (var j = 0; j < HEIGHT; ++j) {
      this.board[i][j] = EMPTY;
    }
  }
}

Tictactoe.prototype = Object.create(Game.prototype);
Tictactoe.prototype.constructor = Tictactoe;

Tictactoe.prototype.initWithGameData = function(gameData) {
  this.moves = gameData.moves;
  this.board = gameData.board;
  this.settings = gameData.settings;
};

Tictactoe.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  gameData.board = this.board;
  gameData.settings = this.settings;
  return gameData;
};

Tictactoe.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? X : O;
}

Tictactoe.prototype.getColourAt = function(position) {
  return this.board[position.x][position.y];
};

Tictactoe.prototype.setColourAt = function(position, colour) {
  this.board[position.x][position.y] = colour;
};

Tictactoe.prototype.isPositionOnBoard = function(position) {
  if (position.x < 0 || position.x >= WIDTH) {
    return false;
  }
  if (position.y < 0 || position.y >= HEIGHT) {
    return false;
  }
  return true;
};

// Checks if the move is valid.
// This is necessary since we might not know the origin of the move object.
Tictactoe.prototype.validateMove = function(move) {
  this.validateFormatOfMove(move);
  this.validateLegalityOfMove(move);
};

// We check if the move object follows the proper format.
// {x, y} where x and y are 0, 1, or 2.
Tictactoe.prototype.validateFormatOfMove = function(move) {
  var format = "'move' should follow the format {x, y} where x and y are 0, 1, or 2.";
  if (typeof move != "object") {
    throw new Error("'move'= " + JSON.stringify(move) + " is not an object.\n" + format);
  }
  if (typeof move.x != "number") {
    throw new Error("'move.x'= " + JSON.stringify(move.x) + " is not a number.\n" + format);
  }
  if (move.x != 0 && move.x != 1 && move.x != 2) {
    throw new Error("'move.x'= " + JSON.stringify(move.x) + " is not 0, 1, or 2.\n" + format);
  }
  if (typeof move.y != "number") {
    throw new Error("'move.y'= " + JSON.stringify(move.y) + " is not a number.\n" + format);
  }
  if (move.y != 0 && move.y != 1 && move.y != 2) {
    throw new Error("'move.y'= " + JSON.stringify(move.y) + " is not 0, 1, or 2.\n" + format);
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
  this.setColourAt(move, this.whosTurnIsIt());
  this.moves.push(move);
};

Tictactoe.prototype.getStatus = function() {
  if (this.getWinLine()) {
    return this.moves.length % 2 == 0 ? this.STATUS_ENUM.P2_WIN : this.STATUS_ENUM.P1_WIN;
  }
  if (this.moves.length >= WIDTH * HEIGHT) {
    return this.STATUS_ENUM.DRAW;
  }
  return this.STATUS_ENUM.UNDECIDED;
};

Tictactoe.prototype.getWinLine = function() {
  function isTriple(a, b, c) {
    return a != EMPTY && a == b && a == c;
  }
  // Horizontal check
  for (var y = 0; y < HEIGHT; ++y) {
    if (isTriple(this.getColourAt({x: 0, y: y}), this.getColourAt({x: 1, y: y}), this.getColourAt({x: 2, y: y}))) {
      return {c1: {x: 0, y: y}, c2: {x: 2, y: y}};
    }
  }
  // Vertical check
  for (var x = 0; x < WIDTH; ++x) {
    if (isTriple(this.getColourAt({x: x, y: 0}), this.getColourAt({x: x, y: 1}), this.getColourAt({x: x, y: 2}))) {
      return {c1: {x: x, y: 0}, c2: {x: x, y: 2}};
    }
  }
  // Diagonal check
  if (isTriple(this.getColourAt({x: 0, y: 0}), this.getColourAt({x: 1, y: 1}), this.getColourAt({x: 2, y: 2}))) {
      return {c1: {x: 0, y: 0}, c2: {x: 2, y: 2}};
  }
  if (isTriple(this.getColourAt({x: 0, y: 2}), this.getColourAt({x: 1, y: 1}), this.getColourAt({x: 2, y: 0}))) {
      return {c1: {x: 0, y: 2}, c2: {x: 2, y: 0}};
  }
  return null;
}

module.exports = Tictactoe;