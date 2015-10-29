var Assets = require("./assets");
var GameGUI = require("./game_gui");
var Tictactoe = require("../tictactoe");

function TictactoeGUI(game, canvas) {
  GameGUI.call(this, game, canvas);
  this.mouseTarget = {type:"NULL"};
  this.preset = null;
  this.isMouseDisabled = false;

  this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
  this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this));
  this.canvas.addEventListener("click", this.onMouseClick.bind(this));
}

module.exports = TictactoeGUI;

TictactoeGUI.prototype = Object.create(GameGUI.prototype);
TictactoeGUI.prototype.constructor = TictactoeGUI;

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

////////////////////////////////////////
// GameGUI methods override
////////////////////////////////////////

TictactoeGUI.prototype.setMouseDisabled = function(mouseDisabled) {
  this.isMouseDisabled = mouseDisabled;
  this.clean();
};

TictactoeGUI.prototype.clean = function() {
  this.preset = null;
  this.mouseTarget = {type: "NULL"};
};

TictactoeGUI.prototype.getMove = function() {
  return this.preset;
};

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

////////////////////////////////////////
// Mouse event handlers
////////////////////////////////////////

TictactoeGUI.prototype.onMouseMove = function(e) {
  if (this.isMouseDisabled) {
    this.mouseTarget = {type: "NULL"};
    return;
  }
  var coordinates = this.getMouseCoordinates(e);
  var x = coordinates.x;
  var y = coordinates.y;
  this.mouseTarget = {type: "NULL"};
  if (x < 25 || y < 25 || x > 475 || y > 475) {
    return;
  }
  if ((x - 30) % 150 > 140 || (y - 30) % 150 > 140) {
    return;
  }
  var p = {x: Math.round((x - 100) / 150), y: Math.round((y - 100) / 150)};
  if (this.game.getColourAt(p) != 3) {
    return;
  }
  if (this.preset && isSamePosition(this.preset, p)) {
    this.mouseTarget = {type: "PRESET"};
  } else if (!this.preset) {
    this.mouseTarget = {type: "BOARD", position: p};
  }
};

TictactoeGUI.prototype.onMouseOut = function(e) {
  this.mouseTarget = {type:"NULL"};
};

TictactoeGUI.prototype.onMouseClick = function(e) {
  this.onMouseMove(e);
  if (this.mouseTarget.type == "BOARD") {
    this.preset = this.mouseTarget.position;
    this.changeHappened();
  } else if (this.mouseTarget.type == "PRESET") {
    this.preset = null;
    this.changeHappened();
  }
  this.mouseTarget = {type: "NULL"};
};

////////////////////////////////////////
// Draw helpers
////////////////////////////////////////

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
      if (this.game.board[i][j] == 1) {
        this.drawMove({x: i, y: j}, Assets.X);
      } else if (this.game.board[i][j] == 2) {
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
