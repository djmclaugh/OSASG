var Assets = require("./assets");
var GameGUI = require("./game_gui");
var Hex = require("../hex");

function HexGUI(game, canvas) {
  GameGUI.call(this, game, canvas);
  this.size = this.game.settings.size;
  this.mouseTarget = null;
  this.preset = null;
  this.isMouseDisabled = false;

  this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
  this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this));
  this.canvas.addEventListener("click", this.onMouseClick.bind(this));
}

module.exports = HexGUI;

HexGUI.prototype = Object.create(GameGUI.prototype);
HexGUI.prototype.constructor = HexGUI;

HexGUI.prototype.coordinateToPosition = function(c) {
  return this.game.coordinateToPosition(c);
};

HexGUI.prototype.positionToCoordinate = function(p) {
  return this.game.positionToCoordinate(p);
};

////////////////////////////////////////
// GameGUI methods override
////////////////////////////////////////

HexGUI.prototype.setMouseDisabled = function(mouseDisabled) {
  this.isMouseDisabled = mouseDisabled;
  this.clean();
};

HexGUI.prototype.clean = function() {
  this.preset = null;
  this.mouseTarget = null;
};

HexGUI.prototype.getMove = function() {
  if (this.preset === null) {
    return null;
  }
  if (this.game.getColourAt(this.preset) != this.game.COLOUR_ENUM.EMPTY) {
    return -1;
  }
  return this.preset;
};

HexGUI.prototype.draw = function() {
  this.context.drawImage(Assets.getHexBoard(this.size), 0, 0);
  if (this.game !== null) {
    this.drawMoves();
    this.drawMarkup();
    this.drawPreset();
    this.drawMouse();
    var status = this.game.getStatus();
    if (status == this.game.STATUS.P1_WIN || status == this.game.STATUS.P2_WIN) {
      this.drawWin(this.game.getWinPath());
    }
  }
};

////////////////////////////////////////
// Mouse event handlers
////////////////////////////////////////

HexGUI.prototype.onMouseMove = function(e) {
  if (this.isMouseDisabled) {
    this.mouseTarget = null;
    return;
  }
  console.log(this.getMouseCoordinates(e));
  var c = this.screenToBoard(this.getMouseCoordinates(e));
  console.log(c);
  if (!c) {
    this.mouseTarget = null;
  } else {
    var p = this.coordinateToPosition(c);
    if (this.game.moves.length == 1 && this.game.getColourAt(p) == this.game.COLOUR_ENUM.RED) {
      this.mouseTarget = p;
    } else if (this.game.getColourAt(p) == this.game.COLOUR_ENUM.EMPTY
      && (this.preset === p || this.preset === null)) {
      this.mouseTarget = p;
    }
  }
};

HexGUI.prototype.onMouseOut = function(e) {
  this.mouseTarget = null;
};

HexGUI.prototype.onMouseClick = function(e) {
  this.onMouseMove(e);
  if (this.preset === this.mouseTarget) {
    this.preset = null;
    this.changeHappened();
  } else if (this.preset === null) {
    this.preset = this.mouseTarget;
    this.changeHappened();
  }
  this.mouseTarget = null;
};

////////////////////////////////////////
// Draw helpers
////////////////////////////////////////

HexGUI.prototype.screenToBoard = function(screen) {
  var radius = 160 / this.size;
  var center = (this.size - 1) / 2;
  rowHeight = 0.87 * 2 * radius;
  var topRowCenter = 250 - (rowHeight * center);
  // Find the appropriate height
  var yDiff = screen.y - topRowCenter;
  var rowOffset = yDiff / rowHeight;
  rowOffset += 0.5;
  var yRemainder = rowOffset % 1;
  var row = Math.floor(rowOffset);
  // Find the appropriate width
  var leftColumnCenter = 250 - (2 * radius * center);
  leftColumnCenter += (row - center) * radius;
  var xDiff = screen.x - leftColumnCenter;
  var columnOffset = xDiff / (2 * radius);
  columnOffset += 0.5;
  var xRemainder = columnOffset % 1
  var column = Math.floor(columnOffset);
  if (Math.pow(Math.abs(yRemainder - 0.5), 2) + Math.pow(Math.abs(xRemainder - 0.5), 2) < 0.25
      && column >= 0 && column < this.size
      && row >= 0 && row < this.size) {
    return {x: column, y: row};
  }
  return null;
};

HexGUI.prototype.boardToScreen = function(board) {
  var center = this.size / 2;
  var radius = 160 / this.size;
  var centerX = board.x + 0.5 - center;
  centerX += (board.y + 0.5 - center) / 2
  var centerY = board.y + 0.5 - center;
  var actualCenterX = 250 + 2 * radius * centerX;
  var actualCenterY = 250 + 0.87 * 2 * radius * centerY;
  return {x: actualCenterX, y: actualCenterY};
};

HexGUI.prototype.drawWin = function(winPath) {
  for (var i = 0; i < winPath.length; ++i) {
    this.drawMove(winPath[i], Assets.HEX_HIGHLIGHT_1);
  }
};

HexGUI.prototype.drawMoves = function() {
  var red = Assets.getHexRedStone(this.size);
  var blue = Assets.getHexBlueStone(this.size);
  // Handle the first two moves seperately because of potential swap.
  if (this.game.moves.length == 1) {
    var firstMove = this.game.moves[0];
    if (this.preset !== firstMove && this.mouseTarget !== firstMove) {
      this.drawMove(this.positionToCoordinate(firstMove), red);
    }
  } else if (this.game.moves.length >= 2) {
    if (this.game.moves[1] == -1) {
      var swapped = this.game.swappedPosition(this.game.moves[0]);
      this.drawMove(this.positionToCoordinate(swapped), blue);
    } else {
      this.drawMove(this.positionToCoordinate(this.game.moves[0]), red);
      this.drawMove(this.positionToCoordinate(this.game.moves[1]), blue);
    }
  }
  for (var i = 2; i < this.game.moves.length; ++i) {
    var position = this.game.moves[i];
    var mark = (i % 2) == 0 ? Assets.getHexRedStone(this.size) : Assets.getHexBlueStone(this.size);
    this.drawMove(this.positionToCoordinate(position), mark);
  }
};

HexGUI.prototype.drawPreset = function() {
  this.drawShadow(this.preset, 0.5);
};

HexGUI.prototype.drawMouse = function() {
  this.drawShadow(this.mouseTarget, 0.25);
};

HexGUI.prototype.drawShadow = function(position, alpha) {
  if (position === null) {
    return;
  }
  this.context.save();
  this.context.globalAlpha = alpha;
  if (this.game.getColourAt(position) == this.game.COLOUR_ENUM.EMPTY) {
    this.drawMove(this.positionToCoordinate(position), this.getCurrentMark());
  } else {
    this.drawMove(this.positionToCoordinate(position), Assets.getHexRedStone(this.size));
    var swapped = this.game.swappedPosition(position);
    this.drawMove(this.positionToCoordinate(swapped), Assets.getHexBlueStone(this.size));
  }

  this.context.restore();
};

HexGUI.prototype.drawMarkup = function() {
  if (this.game.moves.length == 0) {
    return;
  }
  var markup = Assets.HEX_HIGHLIGHT_2;
  var lastMove = this.game.moves[this.game.moves.length - 1];
  if (lastMove == -1) {
    lastMove = this.game.swappedPosition(this.game.moves[0]);
  }
  this.drawMove(this.positionToCoordinate(lastMove), markup);
};

HexGUI.prototype.getCurrentMark = function() {
  if (this.game.moves.length % 2 == 0) {
    return Assets.getHexRedStone(this.size);
  }
  return Assets.getHexBlueStone(this.size);
};

HexGUI.prototype.drawMove = function(coordinate, image) {
  var screenCoordinate = this.boardToScreen(coordinate);
  this.context.drawImage(image,
      screenCoordinate.x - image.width / 2,
      screenCoordinate.y - image.height / 2);
};

