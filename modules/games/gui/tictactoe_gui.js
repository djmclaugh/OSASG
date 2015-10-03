var Tictactoe = require("../tictactoe");
var Assets = require("./assets");

function TictactoeGUI(canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  
  this.game = null;
  
  this.mouseTarget = {type:"NULL"};
  this.preset = null;
}

TictactoeGUI.prototype.createGame = function(gameData) {
  this.game = new Tictactoe();
  this.game.initFromGameData(gameData);
};

TictactoeGUI.prototype.onMouseMove = function(x, y) {
  this.mouseTarget = {type: "NULL"};
  if (x < 25 || y < 25 || x > 475 || y > 475) {
    return;
  }
  if ((x - 30) % 150 > 140 || (y - 30) % 150 > 140) {
    return;
  }
  var p = {x: Math.round((x - 100) / 150), y: Math.round((y - 100) / 150)};
  if (this.game.getColourAt(p) != "EMPTY") {
    return;
  }
  if (this.preset && isSamePosition(this.preset, p)) {
    this.mouseTarget = {type: "PRESET"};
  } else if (!this.isReadyToCommit()) {
    this.mouseTarget = {type: "BOARD", position: p};
  }
};

TictactoeGUI.prototype.onMouseOut = function(event) {
  this.mouseTarget = {type:"NULL"};
};

TictactoeGUI.prototype.onMouseClick = function(x, y) {
  this.onMouseMove(x, y);
  if (this.mouseTarget.type == "BOARD") {
    this.preset = this.mouseTarget.position;
  } else if (this.mouseTarget.type == "PRESET") {
    this.preset = null;
  }
  this.mouseTarget = {type: "NULL"};
};

TictactoeGUI.prototype.makeMove = function(move) {
  this.preset = null;
  this.game.makeMove(move);
};

TictactoeGUI.prototype.isReadyToCommit = function() {
  if (!this.game) {
    return false;
  }
  return this.preset != null;
};

TictactoeGUI.prototype.getMove = function() {
  if (this.isReadyToCommit()) {
    return this.preset;
  }
  return null;
}

TictactoeGUI.prototype.draw = function() {
  this.context.drawImage(Assets.TICTACTOE_BOARD, 0, 0);
  if (this.game !== null) {
    this.drawMoves();
    this.drawMarkup();
    this.drawPreset();
    this.drawMouse();
    var status = this.game.getStatus();
    if (status == this.game.STATUS_ENUM.P1_WIN || status == this.game.STATUS_ENUM.P2_WIN) {
      this.drawWin(this.game.getWinLine());
    }
  }
};

TictactoeGUI.prototype.drawWin = function(win_line, colour) {
  this.context.save();
  this.context.lineWidth = 5;
  this.context.strokeStyle = "0x000000";
  this.context.lineCap = "round";
  this.context.beginPath();
  this.context.moveTo(100 + (150 * win_line.c1.x), 100 + (150 * win_line.c1.y));
  this.context.lineTo(100 + (150 * win_line.c2.x), 100 + (150 * win_line.c2.y));
  this.context.stroke();
  this.context.restore();
};

TictactoeGUI.prototype.drawMoves = function() {
  for (var i = 0; i < this.game.board.length; ++i) {
    for (var j = 0; j < this.game.board.length; ++j) {
      if (this.game.board[i][j] == this.game.PLAYER_ENUM.P1) {
        this.drawMove({x: i, y: j}, Assets.X);
      } else if (this.game.board[i][j] == this.game.PLAYER_ENUM.P2) {
        this.drawMove({x: i, y: j}, Assets.O);
      }
    }
  }
};

TictactoeGUI.prototype.drawPreset = function() {
  if (this.preset == null) {
    return;
  }
  var mark = this.getCurrentMark();
  this.context.save();
  this.context.globalAlpha = 0.5;
  this.drawMove(this.preset, mark);
  this.context.restore();
};

TictactoeGUI.prototype.drawMouse = function() {
  if (this.mouseTarget.type == "BOARD") {
    var mark = this.getCurrentMark();
    this.context.save();
    this.context.globalAlpha = 0.25;
    this.drawMove(this.mouseTarget.position, mark);
    this.context.restore();
  } else if (this.mouseTarget.type == "PRESET") {
    var m = this.getCurrentMark();
    this.context.save();
    this.context.globalAlpha = 0.25;
    this.drawMove(this.preset, m);
    this.context.restore();
  }
};

TictactoeGUI.prototype.drawMarkup = function() {
  if (this.game.moves.length == 0) {
    return;
  }
  var markup = Assets.BOX_HIGHLIGHT;
  var lastMove = this.game.moves[this.game.moves.length - 1];
  this.drawMove(lastMove, markup);
};

TictactoeGUI.prototype.getCurrentMark = function() {
  if (this.game.moves.length % 2 == 0) {
    return Assets.X;
  }
  return Assets.O;
};

TictactoeGUI.prototype.drawMove = function(position, image) {
  this.context.drawImage(image, (position.x * 150) + 25, (position.y * 150) + 25);
};

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

module.exports = TictactoeGUI;
