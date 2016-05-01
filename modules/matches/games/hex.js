var Board = require("./shared/board");
var Game = require("./game");

const EMPTY = 0;
const RED = 1;
const BLUE = 2;

// Hex CLASS
function Hex(settings) {  
  if (settings && settings.size) {
    this.resetGame(settings);
  } else {
    this.resetGame({size: 11});
  }
}

Hex.prototype = Object.create(Game.prototype);
Hex.prototype.constructor = Hex;

module.exports = Hex;

Hex.prototype.COLOUR_ENUM = {
  RED: RED,
  BLUE: BLUE,
  EMPTY: EMPTY
};

Hex.prototype.resetGame = function(settings) {
  this.moves = [];
  this.board = new Board(settings.size, settings.size, 3);
  this.settings = settings;
};

Hex.prototype.initFromGameData = function(gameData) {
  this.resetGame(gameData.settings);
  for (var i = 0; i < gameData.moves.length; ++i) {
    this.makeMove(gameData.moves[i]);
  }
};

Hex.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  gameData.settings = this.settings;
  return gameData;
};

Hex.prototype.positionToCoordinate = function(p) {
  return this.board.positionToCoordinate(p);
};

Hex.prototype.coordinateToPosition = function(c) {
  return this.board.coordinateToPosition(c);
};

Hex.prototype.swappedPosition = function(p) {
  return this.board.swappedXYPosition(p);
};

Hex.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? this.PLAYER_ENUM.P1 : this.PLAYER_ENUM.P2;
};

Hex.prototype.getColourAt = function(position) {
  return this.board.getStateAtPosition(position);
};

Hex.prototype.setColourAt = function(position, colour) {
  this.board.setStateAtPosition(position, colour);
};

// Checks if the move is valid.
// This is necessary since we might not know the origin of the move object.
Hex.prototype.validateMove = function(move) {
  this.validateFormatOfMove(move);
  this.validateLegalityOfMove(move);
};

// We check if the move object follows the proper format.
// "move" should be a number in [-1, n^2) representing which cell has been played in.
// -1 means you want to swap
// any other number means you want to play in that cell
// (cells are labeled from left to right, then top to bottom like in this 3x3 example:
// 0 1 2
//  3 4 5
//   6 7 8
Hex.prototype.validateFormatOfMove = function(move) {
  var numCells = this.settings.size * this.settings.size;
  var expectedFormat = "A a natural number from -1 to " + (numCells - 1);
  if (typeof move != "number" || move % 1 != 0
      || (move != -1 && !this.board.isValidPosition(move))) {
    throw new this.InvalidMoveFormatError(move, expectedFormat);
  }
};

// We assume that the move object has the proper format.
Hex.prototype.validateLegalityOfMove = function(move) {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    throw new this.IllegalMoveError(move, "No moves are legal since the game is already over.");
  }
  if (move == -1) {
    if (this.moves.length != 1) {
      throw new this.IllegalMoveError(move, "You can only swap as the second move.");
    } else {
      return;
    } 
  }
  if (this.getColourAt(move) != EMPTY) {
    throw new this.IllegalMoveError(move, "Received move is an already occupied position.");
  }
};

Hex.prototype.getLegalMoves = function() {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    return [];
  }
  var legalMoves = this.board.getPositionsWithState(EMPTY);
  if (this.moves.length == 1) {
    legalMoves.push(-1);
  }
  return legalMoves;
};

Hex.prototype.makeMove = function(move) {
  this.validateMove(move);
  if (move == -1) {
    this.setColourAt(this.moves[0], EMPTY);
    this.setColourAt(this.board.swappedXYPosition(this.moves[0]), BLUE);
  } else {
    this.setColourAt(move, this.moves.length % 2 == 0 ? RED : BLUE);
  }
  this.moves.push(move);
};

Hex.prototype.undoLastMove = function() {
  var move = this.moves.pop();
  if (move == -1) {
    this.setColourAt(this.board.swappedXYPosition(this.moves[0]), EMPTY);
    this.setColourAt(this.moves[0], RED);
  }
  this.setColourAt(move, EMPTY);
};

Hex.prototype.getStatus = function() {
  if (this.getWinPath()) {
    return this.moves.length % 2 == 0 ? this.STATUS_ENUM.P2_WIN : this.STATUS_ENUM.P1_WIN;
  }
  // No draws are possible in Hex. So if now one won, it is still undecided.
  return this.STATUS_ENUM.UNDECIDED;
};

Hex.prototype.getWinPath = function() {
  // Use BFS to find a red left-right path of minimal length
  var parents = {};
  var toCheck = [];
  for (var i = 0; i < this.settings.size; ++i) {
    var c = {x: 0, y: i};
    if (this.board.getStateAtCoordinate(c) == RED) {
      parents[getKey(c)] = null;
      toCheck.push(c);
    }
  }
  for (var i = 0; i < toCheck.length; ++i) {
    var c  = toCheck[i];
    var neighbours = this.getNeighbours(c);
    for (var j = 0; j < neighbours.length; ++j) {
      var neighbour = neighbours[j];
      var key = getKey(neighbour);
      if (this.board.getStateAtCoordinate(neighbour) == RED && !(key in parents)) {
        parents[key] = c;
        toCheck.push(neighbour);
        if (neighbour.x == this.settings.size - 1) {
          return createPath(neighbour, parents);
        }
      }
    } 
  }

  // Use BFS to find a blue top-down path of minimal length
  parents = {};
  toCheck = [];
  for (var i = 0; i < this.settings.size; ++i) {
    var c = {x: i, y: 0};
    if (this.board.getStateAtCoordinate(c) == BLUE) {
      parents[getKey(c)] = null;
      toCheck.push(c);
    }
  }
  for (var i = 0; i < toCheck.length; ++i) {
    var c  = toCheck[i];
    var neighbours = this.getNeighbours(c);
    for (var j = 0; j < neighbours.length; ++j) {
      var neighbour = neighbours[j];
      var key = getKey(neighbour);
      if (this.board.getStateAtCoordinate(neighbour) == BLUE && !(key in parents)) {
        parents[key] = c;
        toCheck.push(neighbour);
        if (neighbour.y == this.settings.size - 1) {
          return createPath(neighbour, parents);
        }
      }
    }
  }
  
  // No winning path has been found
  return null;
};

Hex.prototype.getNeighbours = function(c) {
  var self = this;
  var potentialNeighbours = [
    {x:c.x - 1, y:c.y},
    {x:c.x - 1, y:c.y + 1},
    {x:c.x, y:c.y - 1},
    {x:c.x, y:c.y + 1},
    {x:c.x + 1, y:c.y - 1},
    {x:c.x + 1, y:c.y},
  ];
  var neighbours = potentialNeighbours.filter(function(value) {
    return self.board.isValidCoordinate(value);
  });
  return neighbours;
};

// Creates a path (array of coordinates) based on startCoordinate and nextCoordinates
// startCoordinate is the first coordinate in the path
// nextCoordinates is a dictionary where the keys are strings representing a coordinates and the
// values are the coorindates that should follow the coordinate represented in their keys.
function createPath(startCoordinate, nextCoordinates) {
  var path = [];
  var currentNode = null;
  var nextNode = startCoordinate;
  while (nextNode != null) {
    path.push(nextNode);
    currentNode = nextNode;
    nextNode = nextCoordinates[getKey(currentNode)];
  };
  return path;
}

// Creates a string that uniquly identifies a coordinate.
function getKey(coordinate) {
  return coordinate.x + ":" + coordinate.y;
}
