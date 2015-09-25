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