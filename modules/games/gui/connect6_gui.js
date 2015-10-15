var Connect6 = require("../connect6");
var Assets = require("./assets");

function Connect6GUI(canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  
  this.game = null;
  
  this.mouseTarget = {type:"NULL"};
  this.preset = [];
}

Connect6GUI.prototype.createGame = function(gameData) {
  this.game = new Connect6({});
  this.game.initFromGameData(gameData);
};

Connect6GUI.prototype.onMouseMove = function(x, y) {
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
  } else if (!this.isReadyToCommit()) {
    this.mouseTarget = {type: "BOARD", position: p};
  }
};

Connect6GUI.prototype.onMouseOut = function(event) {
  this.mouseTarget = {type:"NULL"};
};

Connect6GUI.prototype.onMouseClick = function(x, y) {
  this.onMouseMove(x, y);
  if (this.mouseTarget.type == "BOARD") {
    this.preset.push(this.mouseTarget.position);
  } else if (this.mouseTarget.type == "PRESET") {
    this.preset.splice(this.mouseTarget.index, 1);
  }
  this.mouseTarget = {type: "NULL"};
};

Connect6GUI.prototype.makeMove = function(move) {
  this.preset = [];
  this.game.makeMove(move);
};

Connect6GUI.prototype.isReadyToCommit = function() {
  if (!this.game) {
    return false;
  }
  if (this.game.moves.length == 0) {
    return this.preset.length == 1;
  }
  return this.preset.length == 2;
};

Connect6GUI.prototype.getMove = function() {
  if (this.isReadyToCommit()) { 
    if (this.preset.length == 1) {
      return {p1: this.preset[0]};
    } else {
      return {p1: this.preset[0], p2: this.preset[1]};
    }
  }
  return null;
}

Connect6GUI.prototype.getPresetIndex = function(position) {
  for (var i = 0; i < this.preset.length; ++i) {
    if (isSamePosition(this.preset[i], position)) {
      return i;
    }
  }
  return -1;
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

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}

module.exports = Connect6GUI;
