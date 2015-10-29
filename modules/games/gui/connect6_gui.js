var Assets = require("./assets");
var Connect6 = require("../connect6");
var GameGUI = require("./game_gui");

function Connect6GUI(game, canvas) {
  GameGUI.call(this, game, canvas);
  this.mouseTarget = {type:"NULL"};
  this.preset = [];
  this.isMouseDisabled = false;

  this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
  this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this));
  this.canvas.addEventListener("click", this.onMouseClick.bind(this));
}

module.exports = Connect6GUI;

Connect6GUI.prototype = Object.create(GameGUI.prototype);
Connect6GUI.prototype.constructor = Connect6GUI;

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

Connect6GUI.prototype.getPresetIndex = function(position) {
  for (var i = 0; i < this.preset.length; ++i) {
    if (isSamePosition(this.preset[i], position)) {
      return i;
    }
  }
  return -1;
};

////////////////////////////////////////
// GameGUI methods override
////////////////////////////////////////

Connect6GUI.prototype.setMouseDisabled = function(mouseDisabled) {
  this.isMouseDisabled = mouseDisabled;
  this.clean();
};

Connect6GUI.prototype.clean = function() {
  this.preset = [];
  this.mouseTarget = {type: "NULL"};
};

Connect6GUI.prototype.getMove = function() {
  if (this.preset.length == 2 && this.game.moves.length > 0) {
    return {p1: this.preset[0], p2: this.preset[1]};
  } else if (this.preset.length == 1 && this.game.moves.length == 0) {
    return {p1: this.preset[0]};
  }
  return null;
};

Connect6GUI.prototype.draw = function() {
  this.context.drawImage(Assets.GO_BOARD, 0, 0);
  if (this.game !== null) {
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
};

////////////////////////////////////////
// Mouse event handlers
////////////////////////////////////////

Connect6GUI.prototype.onMouseMove = function(e) {
  if (this.isMouseDisabled) {
    this.mouseTarget = {type: "NULL"};
    return;
  }

  var coordinates = this.getMouseCoordinates(e);
  var x = coordinates.x;
  var y = coordinates.y;
  
  this.mouseTarget = {type: "NULL"};
  if (x < 15 || y < 15 || x > 485 || y > 485) {
    return;
  }
  if ((x + 10) % 25 > 20 || (y + 10) % 25 > 20) {
    return;
  }
  
  var p = {x: Math.round(x / 25) - 1, y: Math.round(y / 25) - 1};
  
  if (!this.game.isPositionOnBoard(p) || this.game.getColourAt(p) != 3) {
    return;
  }
  
  if (this.getPresetIndex(p) >= 0) {
    this.mouseTarget = {type: "PRESET", index: this.getPresetIndex(p)};
  } else if (this.getMove() == null) {
    this.mouseTarget = {type: "BOARD", position: p};
  }
};

Connect6GUI.prototype.onMouseOut = function(event) {
  this.mouseTarget = {type:"NULL"};
};

Connect6GUI.prototype.onMouseClick = function(e) {
  this.onMouseMove(e);
  if (this.mouseTarget.type == "BOARD") {
    this.preset.push(this.mouseTarget.position);
    this.changeHappened();
  } else if (this.mouseTarget.type == "PRESET") {
    this.preset.splice(this.mouseTarget.index, 1);
    this.changeHappened();
  }
  this.mouseTarget = {type: "NULL"};
};

////////////////////////////////////////
// Draw helpers
////////////////////////////////////////

Connect6GUI.prototype.draw = function() {
  this.context.drawImage(Assets.GO_BOARD, 0, 0);
  if (this.game !== null) {
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
};

Connect6GUI.prototype.drawWin = function(win_line, colour) {
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

Connect6GUI.prototype.drawPlacedStones = function() {
  for (var i = 0; i < this.game.board.length; ++i) {
    for (var j = 0; j < this.game.board.length; ++j) {
      if (this.game.board[i][j] == 1) {
        this.drawStone({x: i, y: j}, Assets.BLACK_STONE);
      } else if (this.game.board[i][j] == 2) {
        this.drawStone({x: i, y: j}, Assets.WHITE_STONE);
      }
    }
  }
};

Connect6GUI.prototype.drawPresetStones = function() {
  var stone = this.getCurrentStone();
  this.context.save();
  this.context.globalAlpha = 0.5;
  for (var i = 0; i < this.preset.length; ++i) {
    this.drawStone(this.preset[i], stone);
  }
  this.context.restore();
};

Connect6GUI.prototype.drawMouse = function() {
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

Connect6GUI.prototype.drawMarkup = function() {
  if (this.game.moves.length == 0) {
    return;
  }
  var markup;
  if (this.game.moves.length % 2 == 0) {
    markup = Assets.WHITE_STONE_LM;
  } else {
    markup = Assets.BLACK_STONE_LM;
  }
  var lastMove = this.game.moves[this.game.moves.length - 1];
  for (var key in lastMove) {
    this.drawStone(lastMove[key], markup);
  }
};

Connect6GUI.prototype.getCurrentStone = function() {
  if (this.game.moves.length % 2 == 0) {
    return Assets.BLACK_STONE;
  }
  return Assets.WHITE_STONE;
};

Connect6GUI.prototype.drawStone = function(position, image) {
  this.context.drawImage(image, (position.x * 25) + 13, (position.y * 25) + 13);
};
