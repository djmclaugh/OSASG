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

function coordinateToPosition(x, y) {
  return x + (3 * y);
}

function positionToCoordinate(p) {
  return {x: p % 3, y: Math.floor(p / 3)};
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
  var coordX = Math.round((x - 100) / 150);
  var coordY = Math.round((y - 100) / 150);
  var p = coordX + (3 * coordY);
  if (this.game.getColourAt(p) != this.game.COLOUR_ENUM.EMPTY) {
    return;
  }
  if (this.preset === p) {
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

TictactoeGUI.prototype.drawWin = function(winLine, colour) {
  for (var i = 0; i < winLine.length; ++i) {
    this.drawMove(winLine[i], Assets.BOX_HIGHLIGHT_2);
  }
};

TictactoeGUI.prototype.drawMoves = function() {
  for (var i = 0; i < this.game.moves.length; ++i) {
    var position = this.game.moves[i];
    var mark = (i % 2) == 0 ? Assets.X : Assets.O;
    this.drawMove(position, mark);
  }
};

TictactoeGUI.prototype.drawPreset = function() {
  if (this.preset === null) {
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
  var markup = Assets.BOX_HIGHLIGHT_1;
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
  var coordinate = positionToCoordinate(position);
  this.context.drawImage(image, (coordinate.x * 150) + 25, (coordinate.y * 150) + 25);
};
