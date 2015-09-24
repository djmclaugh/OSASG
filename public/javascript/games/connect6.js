(function(exports){

// Colours
const BLACK = "BLACK";
const WHITE = "WHITE";
const EMPTY = "EMPTY";

// Status results
const UNDECIDED = "UNDECIDED";
const BLACK_WIN = "BLACK_WIN";
const WHITE_WIN = "WHITE_WIN";
const DRAW = "DRAW";


// Line Class
function Line(c1, c2) {
  this.c1 = c1;
  this.c2 = c2;
}

Line.prototype.length = function() {
  var xDiff = Math.abs(this.c1.x - this.c2.x);
  var yDiff = Math.abs(this.c1.y - this.c2.y);
  return Math.max(xDiff, yDiff) + 1;
}

// Connect6 CLASS
function Connect6(settings) {
  this.width = 19;
  this.height = 19;
  
  this.COLOUR_ENUM = {
    BLACK: BLACK,
    WHITE: WHITE,
    EMPTY: EMPTY
  }
  
  this.STATUS_ENUM = {
    UNDECIDED: UNDECIDED,
    BLACK_WIN: BLACK_WIN,
    WHITE_WIN: WHITE_WIN,
    DRAW: DRAW
  }
    
  this.moves = [];
  this.board = [];
  this.status = UNDECIDED;
  this.settings = settings;
  
  for (var i = 0; i < this.width; ++i) {
    this.board[i] = [];
    for (var j = 0; j < this.height; ++j) {
      this.board[i][j] = EMPTY;
    }
  }
}

Connect6.prototype.init = function(gameData) {
  this.moves = gameData.moves;
  this.board = gameData.board;
  this.status = gameData.status;
  this.settings = gameData.settings;
};

Connect6.prototype.makeGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  gameData.board = this.board;
  gameData.status = this.status;
  gameData.settings = this.settings;
  return gameData;
};

Connect6.prototype.getColourToPlay = function() {
  return this.moves.length % 2 == 0 ? BLACK : WHITE;
}

Connect6.prototype.getColourAt = function(position) {
  return this.board[position.x][position.y];
};

Connect6.prototype.setColourAt = function(position, colour) {
  this.board[position.x][position.y] = colour;
};

Connect6.prototype.isPositionOnBoard = function(position) {
  if (position.x < 0 || position.x >= this.width) {
    return false;
  }
  if (position.y < 0 || position.y >= this.height) {
    return false;
  }
  return true;
};

// Checks if the move is valid.
// This is necessary since we might not know the origin of the move object.
// Returns an error if the move is not valid.
// Returns null if the move is valid.
Connect6.prototype.validateMove = function(move) {
  var error;
  error = this.validateFormatOfMove(move);
  if (error) {
    return error;
  }
  error = this.validateLegalityOfMove(move);
  if (error) {
    return error;
  }
  return null;
};

// We check if the move object follows the proper format.
// {p1:{x, y}, p2:{x, y}} or {p1:{x, y}} where all x and y are natural numbers.
Connect6.prototype.validateFormatOfMove = function(move) {
  var format = "'move' should follow the format {p1:{x, y}, p2:{x, y}} or {p1:{x, y}} where all x and y are natural numbers.";
  if (typeof move != "object") {
    return new Error("'move'= " + move + " is not an object.\n" + format);
  }
  if (typeof move.p1 != "object") {
    return new Error("'move.p1'= " + move.p1 + " is not an object.\n" + format);
  }
  if (typeof move.p1.x != "number" || move.p1.x < 0 || move.p1.x % 1 != 0) {
    return new Error("'move.p1.x'= " + move.p1.x + " is not natural number.\n" + format);
  }
  if (typeof move.p1.y != "number" || move.p1.y < 0 || move.p1.y % 1 != 0) {
    return new Error("'move.p1.y'= " + move.p1.y + " is not natural number.\n" + format);
  }
  if (typeof move.p2 == "object") {
    if (typeof move.p2.x != "number" || move.p2.x < 0 || move.p2.x % 1 != 0) {
      return new Error("'move.p2.x'= " + move.p2.x + " is not natural number.\n" + format);
    }
    if (typeof move.p2.y != "number" || move.p2.y < 0 || move.p2.y % 1 != 0) {
      return new Error("'move.p2.y'= " + move.p2.y + " is not natural number.\n" + format);
    }
  } else if (typeof move.p2 != "null" && typeof move.p2 != "undefined") {
    return new Error("'move.p2'= " + move.p2 + " is not an object, null, or undefined.\n" + format);
  }
  return null;
};

// We assume that the move object has the proper format.
Connect6.prototype.validateLegalityOfMove = function(move) {
  if (this.status != UNDECIDED) {
    return new Error("No moves are legal since the game is already over.");
  }
  if (!this.isPositionOnBoard(move.p1)) {
    return new Error("'move.p1'= " + move.p1 + " is not a position on the " + this.width + " by " + this.height + " board.");
  }
  if (this.getColourAt(move.p1) != EMPTY) {
    return new Error("'move.p1'= " + move.p1 + " is an already occupied position.");
  }
  if (move.p2) {
    if (this.moves.length == 0) {
      return new Error("On the first turn, you can only place a single stone.");
    }
    if (!this.isPositionOnBoard(move.p2)) {
      return new Error("'move.p2'= " + move.p2 + " is not a position on the " + this.width + " by " + this.height + " board.");
    }
    if (this.getColourAt(move.p2) != EMPTY) {
      return new Error("'move.p2'= " + move.p2 + " is an already occupied position.");
    }
  } else {
    if (this.moves.length > 0) {
      return new Error("You must place two stones since this is not the first turn.");
    }
  }
  return null;
};

// Performs the given move.
// Returns an error if the move is not valid for any reason.
// Retruns null if the move was performed successfully.
Connect6.prototype.makeMove = function(move) {
  var error = this.validateMove(move);
  if (error) {
    return error;
  }
  this.setColourAt(move.p1, this.getColourToPlay());
  if (move.p2) {
    this.setColourAt(move.p2, this.getColourToPlay());
  }
  this.moves.push(move);
  this.status = this.getStatus();
  return null;
};

// Returns the undone move.
Connect6.prototype.undoMove = function() {
  if (this.moves.length === 0) {
    return;
  }
  var move = this.moves.pop();
  this.setColourAt(move.p1, EMPTY);
  if (move.p2) {
    this.setColourAt(move.p2, EMPTY);
  }
  this.status = UNDECIDED;
  return move;
};

Connect6.prototype.getStatus = function() {
  if (this.getWinLine()) {
    return this.moves.length % 2 == 0 ? WHITE_WIN : BLACK_WIN;
  }
  if (2 * this.turnNumber - 1 >= this.width * this.height) {
    return DRAW;
  }
  return UNDECIDED;
};

Connect6.prototype.getWinLine = function() {
  for (var i = this.moves.length - 1; i > 1; --i) {
    var line = this.getLongestLineAtPosition(this.moves[i].p1);
    if (line.length() >= 6) {
      return line;
    }
    line = this.getLongestLineAtPosition(this.moves[i].p2);
    if (line.length() >= 6) {
      return line;
    }
  }
  return null;
}

Connect6.prototype.getLongestLineAtPosition = function(position) {
  var self = this;
  var colour = this.getColourAt(position);
  
  if (colour == EMPTY) {
    return null;
  }
  
  function lineEnd(start, direction) {
    var nextPosition = {x: start.x + direction.x, y: start.y + direction.y};
    while (self.isPositionOnBoard(nextPosition) && self.getColourAt(nextPosition) == colour) {
      nextPosition.x += direction.x;
      nextPosition.y += direction.y;
    }
    return {x: nextPosition.x - direction.x, y: nextPosition.y - direction.y};
  }
  
  function getLine(position, direction) {
    var start = lineEnd(position, {x: -direction.x, y: -direction.y});
    var end = lineEnd(position, direction);
    return new Line(start, end);
  }
  
  var line;
  var longestLine = new Line(position, position);
  
  // Horizontal check
  line = getLine(position, {x: 1, y: 0});
  if (line.length() > longestLine.length()) {
    longestLine = line;
  }
  
  // Vertical check
  line = getLine(position, {x: 0, y: 1});
  if (line.length() > longestLine.length()) {
    longestLine = line;
  }
  
  // x = y check
  line = getLine(position, {x: 1, y: 1});
  if (line.length() > longestLine.length()) {
    longestLine = line;
  }
  
  // x = -y check
  line = getLine(position, {x: 1, y: -1});
  if (line.length() > longestLine.length()) {
    longestLine = line;
  }
  
  return longestLine;
};

exports.Connect6 = Connect6;

})(typeof exports == 'undefined' ? this['OSASG'] : exports);