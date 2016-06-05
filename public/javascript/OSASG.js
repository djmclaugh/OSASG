(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Game = require("./game");

// Colours
const BLACK = "BLACK";
const WHITE = "WHITE";
const EMPTY = "EMPTY";

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

Connect6.prototype = Object.create(Game.prototype);

Connect6.prototype.initFromGameData = function(gameData) {
  this.moves = gameData.moves;
  this.board = gameData.board;
  this.settings = gameData.settings;
};

Connect6.prototype.generateGameData = function() {
  var gameData = {};
  gameData.moves = this.moves;
  gameData.board = this.board;
  gameData.settings = this.settings;
  return gameData;
};

Connect6.prototype.getColourToPlay = function() {
  return this.moves.length % 2 == 0 ? BLACK : WHITE;
}

Connect6.prototype.whosTurnIsIt = function() {
  return this.moves.length % 2 == 0 ? this.PLAYER_ENUM.P1 : this.PLAYER_ENUM.P2;
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
Connect6.prototype.validateMove = function(move) {
  this.validateFormatOfMove(move);
  this.validateLegalityOfMove(move);
};

// We check if the move object follows the proper format.
// {p1:{x, y}, p2:{x, y}} or {p1:{x, y}} where all x and y are natural numbers.
Connect6.prototype.validateFormatOfMove = function(move) {
  var format = "'move' should follow the format {p1:{x, y}, p2:{x, y}} or {p1:{x, y}} where all x and y are natural numbers.";
  if (typeof move != "object") {
    throw new Error("'move'= " + JSON.stringify(move) + " is not an object.\n" + format);
  }
  if (typeof move.p1 != "object") {
    throw new Error("'move.p1'= " + JSON.stringify(move.p1) + " is not an object.\n" + format);
  }
  if (typeof move.p1.x != "number" || move.p1.x < 0 || move.p1.x % 1 != 0) {
    throw new Error("'move.p1.x'= " + JSON.stringify(move.p1.x) + " is not natural number.\n" + format);
  }
  if (typeof move.p1.y != "number" || move.p1.y < 0 || move.p1.y % 1 != 0) {
    throw new Error("'move.p1.y'= " + JSON.stringify(move.p1.y) + " is not natural number.\n" + format);
  }
  if (typeof move.p2 == "object") {
    if (typeof move.p2.x != "number" || move.p2.x < 0 || move.p2.x % 1 != 0) {
      throw new Error("'move.p2.x'= " + JSON.stringify(move.p2.x) + " is not natural number.\n" + format);
    }
    if (typeof move.p2.y != "number" || move.p2.y < 0 || move.p2.y % 1 != 0) {
      throw new Error("'move.p2.y'= " + JSON.stringify(move.p2.y) + " is not natural number.\n" + format);
    }
  } else if (typeof move.p2 != "null" && typeof move.p2 != "undefined") {
    throw new Error("'move.p2'= " + JSON.stringify(move.p2) + " is not an object, null, or undefined.\n" + format);
  }
};

// We assume that the move object has the proper format.
Connect6.prototype.validateLegalityOfMove = function(move) {
  if (this.getStatus() != this.STATUS_ENUM.UNDECIDED) {
    throw new Error("No moves are legal since the game is already over.");
  }
  if (!this.isPositionOnBoard(move.p1)) {
    throw new Error("'move.p1'= " + JSON.stringify(move.p1) + " is not a position on the " + this.width + " by " + this.height + " board.");
  }
  if (this.getColourAt(move.p1) != EMPTY) {
    throw new Error("'move.p1'= " + JSON.stringify(move.p1) + " is an already occupied position.");
  }
  if (move.p2) {
    if (this.moves.length == 0) {
      throw new Error("On the first turn, you can only place a single stone.");
    }
    if (!this.isPositionOnBoard(move.p2)) {
      throw new Error("'move.p2'= " + JSON.stringify(move.p2) + " is not a position on the " + this.width + " by " + this.height + " board.");
    }
    if (this.getColourAt(move.p2) != EMPTY) {
      throw new Error("'move.p2'= " + JSON.stringify(move.p2) + " is an already occupied position.");
    }
  } else {
    if (this.moves.length > 0) {
      throw new Error("You must place two stones since this is not the first turn.");
    }
  }
};

Connect6.prototype.makeMove = function(move) {
  this.validateMove(move);
  this.setColourAt(move.p1, this.getColourToPlay());
  if (move.p2) {
    this.setColourAt(move.p2, this.getColourToPlay());
  }
  this.moves.push(move);
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
  return move;
};

Connect6.prototype.getStatus = function() {
  if (this.getWinLine()) {
    return this.moves.length % 2 == 0 ? this.STATUS_ENUM.P2_WIN : this.STATUS_ENUM.P1_WIN;
  }
  if (2 * this.moves.length - 1 >= this.width * this.height) {
    return this.STATUS_ENUM.DRAW;
  }
  return this.STATUS_ENUM.UNDECIDED;
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

module.exports = Connect6;
},{"./game":2}],2:[function(require,module,exports){
function Game() {}

Game.prototype.PLAYER_ENUM = {
  P1: "GAME_PLAYER_P1",
  P2: "GAME_PLAYER_P2"
};

Game.prototype.STATUS_ENUM = {
  UNDECIDED: "GAME_STATUS_UNDECIDED",
  P1_WIN: "GAME_STATUS_P1_WIN",
  P2_WIN: "GAME_STATUS_P2_WIN",
  DRAW: "GAME_STATUS_DRAW"
};
  
Game.prototype.initWithGameData = function(gameData) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.generateGameData = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.whosTurnIsIt = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.makeMove = function(move) {
  throw new Error("This method needs to be implemented by the subclass.");
};

Game.prototype.getStatus = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

module.exports = Game;

},{}],3:[function(require,module,exports){
var Connect6 = require("../connect6");
var _c;
var _ctx;

// Board Background
_c = document.createElement("canvas");
_c.width = _c.height = 500;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#DDAA77";
_ctx.fillRect(0, 0, 500, 500);

_ctx.lineWidth = 1;
_ctx.strokeStyle = "black";
_ctx.lineCap = "round";
_ctx.beginPath();
for (var i = 0; i < 19; ++i) {
  _ctx.moveTo(25.5 + (25 * i), 25.5);
  _ctx.lineTo(25.5 + (25 * i), 475.5);
}
for (var j = 0; j < 19; ++j) {
  _ctx.moveTo(25.5, 25.5 + (25 * j));
  _ctx.lineTo(475.5, 25.5 + (25 * j));
}
_ctx.stroke();    
    
GameGUI.BOARD = new Image();
GameGUI.BOARD.src = _c.toDataURL();

// Black Stone
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#000000";
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 10, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
    
GameGUI.BLACK = new Image();
GameGUI.BLACK.src = _c.toDataURL();

// White Stone
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#FFFFFF";
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 10, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
    
GameGUI.WHITE = new Image();
GameGUI.WHITE.src = _c.toDataURL();

// Black Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#FFFFFF";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
    
GameGUI.BLACK_LM = new Image();
GameGUI.BLACK_LM.src = _c.toDataURL();

// White Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.stroke();
    
GameGUI.WHITE_LM = new Image();
GameGUI.WHITE_LM.src = _c.toDataURL();

function GameGUI(socket, canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  this.socket = socket;
  this.view = ""; // BLACK, WHITE, SPECTATOR, LOCAL
  this.game = null;
  this.setings = {};
  this.names = ["", ""];
  
  this.mouseTarget = {type:"NULL"};
  this.preset = [];
  
  this.gameId = null;
  
  this.socket.on("join", this.joinGame.bind(this));
  
  canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
  canvas.addEventListener('click', this.onMouseClick.bind(this));
}

GameGUI.prototype.joinGame = function(data) {
  this.gameID = data;
  this.socket.removeAllListeners("join");
  this.socket.on(this.gameID + "-update", this.receiveInitData.bind(this));
}

GameGUI.prototype.receiveInitData = function(data) {
  this.names = data.names;
  this.settings = data.setting;
  this.view = data.view;
  this.game = new Connect6(this.settings);
  this.game.initFromGameData(data.gameData);
  this.socket.removeAllListeners("Connect6_0-update");
  this.socket.on(this.gameID + "-play", this.receiveMove.bind(this));
};

GameGUI.prototype.startLocal = function() {
  this.view = "LOCAL";
  this.names = ["Black", "White"];
  this.game = new Connect6(this.settings);
  this.socket.removeAllListeners("join");
};

GameGUI.prototype.onMouseMove = function(event) {
  this.mouseTarget = {type:"NULL"};
  var rect = this.canvas.getBoundingClientRect();
  var mouseX = event.clientX - rect.left - 0.5;
  var mouseY = event.clientY - rect.top - 0.5;
  if (mouseX < 500) {
    this.moveOnBoard(mouseX, mouseY);
  } else {
    this.moveOnCP(mouseX, mouseY);
  }
  
};

GameGUI.prototype.moveOnBoard = function(x, y) {
  if (!this.isMyTurn()) {
    return;
  }
  if (x < 15 || y < 15 || x > 485 || y > 485) {
    return;
  }
  if ((x + 10) % 25 > 20 || (y + 10) % 25 > 20) {
    return;
  }
  var p = {x: Math.round(x / 25) - 1, y: Math.round(y / 25) - 1};
  if (!this.game.isPositionOnBoard(p) || this.game.getColourAt(p) != this.game.COLOUR_ENUM.EMPTY) {
    return;
  }
  if (this.getPresetIndex(p) >= 0) {
    this.mouseTarget = {type: "PRESET", index: this.getPresetIndex(p)};
  } else if (!this.isReadyToCommit()) {
    this.mouseTarget = {type: "BOARD", position: p};
  }
};

GameGUI.prototype.moveOnCP = function(x, y) {
  this.mouseTarget = {type:"NULL"};
};

GameGUI.prototype.onMouseOut = function(event) {
  this.mouseTarget = {type:"NULL"};
};

GameGUI.prototype.onMouseClick = function(event) {
  this.onMouseMove(event);
  if (this.mouseTarget.type == "BOARD") {
    this.preset.push(this.mouseTarget.position);
  } else if (this.mouseTarget.type == "PRESET") {
    this.preset.splice(this.mouseTarget.index, 1);
  }
  if (this.view == "LOCAL" && this.isReadyToCommit()) {
    this.localCommit();
  } else if (this.isReadyToCommit()) {
    this.commit();
  }
  
};

GameGUI.prototype.localCommit = function() {
  if (this.preset.length == 1) {
    this.game.makeMove({p1: this.preset[0]});
  } else {
    this.game.makeMove({p1: this.preset[0], p2: this.preset[1]});
  }
  this.preset = [];
};

GameGUI.prototype.receiveMove = function(move) {
  this.game.makeMove(move);
};

GameGUI.prototype.commit = function() {
  var move;
  if (this.preset.length == 1) {
    move = {p1: this.preset[0]};
  } else {
    move = {p1: this.preset[0], p2: this.preset[1]};
  }
  this.game.makeMove(move);
  this.preset = [];
  this.socket.emit(this.gameID + "-play", move);
};

GameGUI.prototype.isReadyToCommit = function() {
  if (this.game.moves.length == 0) {
    return this.preset.length == 1;
  }
  return this.preset.length == 2;
};

GameGUI.prototype.getPresetIndex = function(position) {
  for (var i = 0; i < this.preset.length; ++i) {
    if (isSamePosition(this.preset[i], position)) {
      return i;
    }
  }
  return -1;
};

GameGUI.prototype.draw = function() {
  this.context.drawImage(GameGUI.BOARD, 0, 0);
  if (this.view !== "") {
    this.drawPlacedStones();
    this.drawMarkup();
    this.drawPresetStones();
    this.drawMouse();
    var status = this.game.getStatus();
    if (status == this.game.STATUS_ENUM.P1_WIN) {
      this.drawWin(this.game.getWinLine(), "white");
    } else if (status == this.game.STATUS_ENUM.P2_WIN) {
      this.drawWin(this.game.getWinLine(), "black");
    }
  }
  this.drawCP();
};

GameGUI.prototype.drawWin = function(win_line, colour) {
  this.context.save();
  this.context.lineWidth = 2;
  this.context.strokeStyle = colour;
  this.context.lineCap = "round";
  this.context.beginPath();
  this.context.moveTo(25.5 + (25 * win_line.c1.x), 25.5 + (25 * win_line.c1.y));
  this.context.lineTo(25.5 + (25 * win_line.c2.x), 25.5 + (25 * win_line.c2.y));
  this.context.stroke();
  this.context.restore();
};

GameGUI.prototype.drawCP = function() {
  this.context.save();
  this.context.fillStyle = "black";
  this.context.font = "bold 16px Arial";
  var status = "";
  if (this.game) {
    status = this.game.getStatus();
  }
  if (status === "") {
    this.context.fillText("Waiting to be matched!", 570, 200);
  } else if (status == this.game.STATUS_ENUM.P1_WIN) {
    this.context.fillText("Game over!\nBLACK wins!", 570, 200);
  } else if (status == this.game.STATUS_ENUM.P2_WIN) {
    this.context.fillText("Game over!\nWHITE wins!", 570, 200);
  } else if (status == this.game.STATUS_ENUM.DRAW) {
    this.context.fillText("Game over!\nDRAW!", 570, 200);
  } else {
    this.context.drawImage(GameGUI.BLACK, 600, 100);
    this.context.fillText(this.names[0], 630, 120);
    this.context.drawImage(GameGUI.WHITE, 600, 200);
    this.context.fillText(this.names[1], 630, 220);
  }
  this.context.restore();
};

GameGUI.prototype.drawPlacedStones = function() {
  for (var i = 0; i < this.game.board.length; ++i) {
    for (var j = 0; j < this.game.board.length; ++j) {
      if (this.game.board[i][j] == this.game.COLOUR_ENUM.BLACK) {
        this.drawStone({x: i, y: j}, GameGUI.BLACK);
      } else if (this.game.board[i][j] == this.game.COLOUR_ENUM.WHITE) {
        this.drawStone({x: i, y: j}, GameGUI.WHITE);
      }
    }
  }
};

GameGUI.prototype.drawPresetStones = function() {
  var stone = this.getCurrentStone();
  this.context.save();
  this.context.globalAlpha = 0.5;
  for (var i = 0; i < this.preset.length; ++i) {
    this.drawStone(this.preset[i], stone);
  }
  this.context.restore();
};

GameGUI.prototype.drawMouse = function() {
  if (this.mouseTarget.type == "BOARD") {
    var stone = this.getCurrentStone();
    this.context.save();
    this.context.globalAlpha = 0.25;
    this.drawStone(this.mouseTarget.position, stone);
    this.context.restore();
  } else if (this.mouseTarget.type == "PRESET") {
    var s = this.getCurrentStone();
    this.context.save();
    this.context.globalAlpha = 0.25;
    this.drawStone(this.preset[this.mouseTarget.index], s);
    this.context.restore();
  }
};

GameGUI.prototype.drawMarkup = function() {
  if (this.game.turnNumber === 0) {
    return;
  }
  var markup;
  if (this.game.moves.length % 2 == 0) {
    markup = GameGUI.WHITE_LM;
  } else {
    markup = GameGUI.BLACK_LM;
  }
  var lastMove = this.game.moves[this.game.moves.length - 1];
  for (var key in lastMove) {
    this.drawStone(lastMove[key], markup);
  }
};

GameGUI.prototype.getCurrentStone = function() {
  if (this.game.moves.length % 2 == 0) {
    return GameGUI.BLACK;
  }
  return GameGUI.WHITE;
};

GameGUI.prototype.drawStone = function(position, image) {
  this.context.drawImage(image, (position.x * 25) + 13, (position.y * 25) + 13);
};

GameGUI.prototype.isMyTurn = function() {
  if (!this.game || this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    return false;
  }
  if (this.view == "LOCAL") {
    return true;
  }
  if (this.view == "P1" && this.game.moves.length % 2 == 0) {
    return true;
  }
  if (this.view == "P2" && this.game.moves.length % 2 == 1) {
    return true;
  }
  return false;
};

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

module.exports = GameGUI;
},{"../connect6":1}],4:[function(require,module,exports){
window.GameGUI = require("./games/gui/connect6_gui");
},{"./games/gui/connect6_gui":3}]},{},[4]);
