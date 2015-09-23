(function(exports){

const BLACK = 1;
const WHITE = -1;
const EMPTY = 0;

function Connect6(settings) {
  this.width = 19;
  this.height = 19;
  this.turnNumber = 0;
  this.turn = BLACK;
  this.BLACK = BLACK;
  this.WHITE = WHITE;
  this.EMPTY = EMPTY;
  this.moves = [];
  this.board = [];
  this.settings = settings;
  for (var i = 0; i < this.width; ++i) {
    this.board[i] = [];
    for (var j = 0; j < this.height; ++j) {
      this.board[i][j] = EMPTY;
    }
  }
}

Connect6.prototype.init = function(gameData) {
  this.turnNumber = gameData.turnNumber;
  this.turn = gameData.turn;
  this.moves = gameData.moves;
  this.board = gameData.board;
  this.settings = gameData.settings;
};

Connect6.prototype.makeGameData = function() {
  var gameData = {};
  gameData.turnNumber = this.turnNumber;
  gameData.turn = this.turn;
  gameData.moves = this.moves;
  gameData.board = this.board;
  gameData.settings = this.settings;
  return gameData;
};

Connect6.prototype.getColourAt = function(position) {
  if (!this.isPositionInBoard(position)) {
    return EMPTY;
  }
  return this.board[position.x][position.y];
};

Connect6.prototype.isEmptyAt = function(position) {
  return this.isPositionInBoard(position) && this.board[position.x][position.y] == EMPTY;
};

Connect6.prototype.setColourAt = function(position, colour) {
  if (!this.isPositionInBoard(position)) {
    return;
  }
  this.board[position.x][position.y] = colour;
};

Connect6.prototype.isValidMove = function(move) {
  if (!move) {
    return false;
  }
  if (!move.p1) {
    return false;
  }
  if (typeof move.p1.x != "number" || typeof move.p1.y != "number") {
    return false;
  }
  if (move.p2 && (typeof move.p2.x != "number" || typeof move.p2.y != "number")) {
    return false;
  }
  return true;
};

Connect6.prototype.isPositionInBoard = function(position) {
  if (position.x < 0 || position.x >= this.width) {
    return false;
  }
  if (position.y < 0 || position.y >= this.height) {
    return false;
  }
  return true;
};

Connect6.prototype.isLegalMove = function(move) {
  if (!this.isValidMove(move)) {
    return false;
  }
  if (!move.p1 || !this.isPositionInBoard(move.p1) ||
      this.getColourAt(move.p1) != EMPTY) {
    return false;
  }
  if (!move.p2 && this.turnNumber > 0) {
    return false;
  }
  if (move.p2 && (!this.isPositionInBoard(move.p2) ||
      this.getColourAt(move.p2) != EMPTY)) {
    return false;
  }
  return true;
};

Connect6.prototype.makeMove = function(move) {
  if (!this.isLegalMove(move)) {
    return false;
  }
  this.setColourAt(move.p1, this.turn);
  if (move.p2) {
    this.setColourAt(move.p2, this.turn);
  }
  this.moves.push(move);
  this.nextTurn();
  return true;
};

Connect6.prototype.undoMove = function() {
  if (this.moves.length === 0) {
    return;
  }
  var move = this.moves.pop();
  this.setColourAt(move.p1, EMPTY);
  if (move.p2) {
    this.setColourAt(move.p2, EMPTY);
  }
  this.prevTurn();
};

Connect6.prototype.nextTurn = function() {
  this.turn *= -1;
  this.turnNumber += 1;
};

Connect6.prototype.prevTurn = function() {
  this.turn *= -1;
  this.turnNumber -= 1;
};

Connect6.prototype.whoWins = function() {
  var currentColour = -1 * this.turn;
  for (var i = this.moves.length - 1; i >= 5; ++i) {
    if (this.isPartOfWin(this.moves[i].p1) ||
        this.isPartOfWin(this.moves[i].p2)) {
      return currentColour;
    }
    currentColour *= -1;
  }
  return 0;
};

Connect6.prototype.getStatusAfterLastMove = function() {
  var status = {};
  status.result = "NOTHING";
  if (this.turnNumber < 5) {
    return status;
  }
  var lastMove = this.moves[this.moves.length - 1];
  var line = this.getLongestLine(lastMove.p1);
  if (line1Norm(line) >= 5) {
    status.result = "WIN";
    status.line = line;
    return status;
  }
  line = this.getLongestLine(lastMove.p2);
  if (line1Norm(line) >= 5) {
    status.result = "WIN";
    status.line = line;
    return status;
  }
  if (2 * this.turnNumber - 1 > this.width * this.height) {
    status.result = "DRAW";
    return status;
  }
  return status;
};

function line1Norm(line) {
  return Math.max(line[0].x - line[1].x, line[1].x - line[0].x,
      line[0].y - line[1].y, line[1].y - line[0].y);
}

Connect6.prototype.getLongestLine = function(position) {
  var x = position.x;
  var y = position.y;
  var colour = this.getColourAt(position);
  if (colour == EMPTY) {
    return {x: -1, y: -1};
  }
  var length;
  var maxLength = 1;
  var p1 = {x: x, y: y};
  var p2 = {x: x, y: y};
  var curX;
  var curY;
  var bestX1;
  var bestX2;
  var bestY1;
  var bestY2;
  var i;
  
  // Horizontal check
  length = 1;
  for (i = 1; i > 0; ++i) {
    curX = x + i;
    curY = y;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX1 = curX;
    bestY1 = curY;
    length += 1;
  }
  for (i = 1; i > 0; ++i) {
    curX = x - i;
    curY = y;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX2 = curX;
    bestY2 = curY;
    length += 1;
  }
  if (length > maxLength) {
    p1 = {x: bestX1, y: bestY1};
    p2 = {x: bestX2, y: bestY2};
    maxLength = length;
  }
  
  // Vertical check
  length = 1;
  for (i = 1; i > 0; ++i) {
    curX = x;
    curY = y + i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX1 = curX;
    bestY1 = curY;
    length += 1;
  }
  for (i = 1; i > 0; ++i) {
    curX = x;
    curY = y - i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX2 = curX;
    bestY2 = curY;
    length += 1;
  }
  if (length > maxLength) {
    p1 = {x: bestX1, y: bestY1};
    p2 = {x: bestX2, y: bestY2};
    maxLength = length;
  }
  
  // x=y check
  length = 1;
  for (i = 1; i > 0; ++i) {
    curX = x + i;
    curY = y + i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX1 = curX;
    bestY1 = curY;
    length += 1;
  }
  for (i = 1; i > 0; ++i) {
    curX = x - i;
    curY = y - i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX2 = curX;
    bestY2 = curY;
    length += 1;
  }
  if (length > maxLength) {
    p1 = {x: bestX1, y: bestY1};
    p2 = {x: bestX2, y: bestY2};
    maxLength = length;
  }
  
  // x=-y check
  length = 1;
  for (i = 1; i > 0; ++i) {
    curX = x + i;
    curY = y - i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX1 = curX;
    bestY1 = curY;
    length += 1;
  }
  for (i = 1; i > 0; ++i) {
    curX = x - i;
    curY = y + i;
    if (this.getColourAt({x:curX, y:curY}) != colour) {
      break;
    }
    bestX2 = curX;
    bestY2 = curY;
    length += 1;
  }
  if (length > maxLength) {
    p1 = {x: bestX1, y: bestY1};
    p2 = {x: bestX2, y: bestY2};
    maxLength = length;
  }
  
  return [p1, p2];
};

exports.Connect6 = Connect6;

})(typeof exports === 'undefined'? this['OSASG'] : exports);