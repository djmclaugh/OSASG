const BLACK = 1;
const WHITE = -1;
const EMPTY = 0;

function Game(settings) {
  this.width = 19;
  this.height = 19;
  this.turnNumber = 0;
  this.turn = BLACK;
  this.BLACK = BLACK;
  this.WHITE = WHITE;
  this.EMPTY = EMPTY;
  this.moves = [];
  this.board = [];
  for (var i = 0; i < this.width; ++i) {
    this.board[i] = [];
    for (var j = 0; j < this.height; ++j) {
      this.board[i][j] = EMPTY;
    }
  }
}

Game.prototype.getColourAt = function(position) {
  if (!this.isPositionInBoard(position)) {
    return EMPTY;
  }
  return this.board[position.x][position.y];
};

Game.prototype.isEmptyAt = function(position) {
  return this.isPositionInBoard(position) && this.board[position.x][position.y] == EMPTY;
};

Game.prototype.setColourAt = function(position, colour) {
  if (!this.isPositionInBoard(position)) {
    return;
  }
  this.board[position.x][position.y] = colour;
};

Game.prototype.isValidMove = function(move) {
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

Game.prototype.isPositionInBoard = function(position) {
  if (position.x < 0 || position.x >= this.width) {
    return false;
  }
  if (position.y < 0 || position.y >= this.height) {
    return false;
  }
  return true;
};

Game.prototype.isLegalMove = function(move) {
  if (!this.isValidMove(move)) {
    return false;
  }
  if (!move.p1 || !this.isPositionInBoard(move.p1) ||this.getColourAt(move.p1) != EMPTY) {
    return false;
  }
  if (!move.p2 && this.turnNumber > 0) {
    return false;
  }
  if (move.p2 && (!this.isPositionInBoard(move.p2) || this.getColourAt(move.p2) != EMPTY)) {
    return false;
  }
  return true;
};

Game.prototype.makeMove = function(move) {
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

Game.prototype.undoMove = function() {
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

Game.prototype.nextTurn = function() {
  this.turn *= -1;
  this.turnNumber += 1;
};

Game.prototype.prevTurn = function() {
  this.turn *= -1;
  this.turnNumber -= 1;
};

Game.prototype.whoWins = function() {
  var currentColour = this.turn;
  for (var i = this.moves.length - 1; i >=5; ++i) {
    if (this.isPartOfWin(this.moves[i].p1) || this.isPartOfWin(this.moves[i].p1)) {
      return currentColour;
    }
  }
  return 0;
};

Game.prototype.isPartOfWin = function(position) {
  var x = position.x;
  var y = position.y;
  var colour = this.getColourAt(position);
  if (colour == EMPTY) {
    return false;
  }
  var length;
  var i;
  // Horizontal check
  length = 1;
  i = 1;
  while (this.getColourAt({x: x-i, y: y}) == colour) {
    length += 1;
  }
  i = 1;
  while (this.getColourAt({x: x+i, y: y}) == colour) {
    length += 1;
  }
  if (length >= 6) {
    return true;
  }
  
  // Vertical check
  length = 1;
  i = 1;
  while (this.getColourAt({x: x, y: y-i}) == colour) {
    length += 1;
  }
  i = 1;
  while (this.getColourAt({x: x, y: y+i}) == colour) {
    length += 1;
  }
  if (length >= 6) {
    return true;
  }
  
  // x=y check
  length = 1;
  i = 1;
  while (this.getColourAt({x: x-i, y: y-i}) == colour) {
    length += 1;
  }
  i = 1;
  while (this.getColourAt({x: x+i, y: y+i}) == colour) {
    length += 1;
  }
  if (length >= 6) {
    return true;
  }
  
  // x=-y check
  length = 1;
  i = 1;
  while (this.getColourAt({x: x-i, y: y+i}) == colour) {
    length += 1;
  }
  i = 1;
  while (this.getColourAt({x: x+i, y: y-i}) == colour) {
    length += 1;
  }
  if (length >= 6) {
    return true;
  }
  
  return false;
};