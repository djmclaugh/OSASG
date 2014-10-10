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

function GameGUI(game, canvas, offsetX, offsetY) {
  this.canvas = canvas;
  this.x = offsetX;
  this.y = offsetY;
  
  this.game = game;
  
  this.mousePosition = null;
  this.preset = [];
  
  canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
  canvas.addEventListener('click', this.onMouseClick.bind(this));
}

GameGUI.prototype.onMouseMove = function(event) {
  var rect = this.canvas.getBoundingClientRect();
  var mouseX = event.clientX - rect.left - 3.5;
  var mouseY = event.clientY - rect.top - 3.5;
  if (mouseX < 15 || mouseY < 15 || mouseX > 485 || mouseY > 485) {
    this.mousePosition = null;
  } else if ((mouseX + 10) % 25 > 20 || (mouseY + 10) % 25 > 20) {
    this.mousePosition = null;
  } else {
    this.mousePosition = {};
    this.mousePosition.x = Math.round(mouseX / 25) - 1;
    this.mousePosition.y = Math.round(mouseY / 25) - 1;
  }
};

GameGUI.prototype.onMouseOut = function(event) {
  this.mousePosition = null;
};

GameGUI.prototype.onMouseClick = function(event) {
  if (this.mousePosition && this.game.isEmptyAt(this.mousePosition)) {
    for (var i = 0; i < this.preset.length; ++i) {
      if (isSamePosition(this.preset[i], this.mousePosition)) {
        this.preset.splice(i, 1);
        this.justPressed = this.mousePosition;
        this.mousePosition = null;
        return;
      }
    }
    if (!this.isReadyToCommit()) {
      this.preset.push(this.mousePosition);
      this.mousePosition = null;
    }
  }
  if (this.isReadyToCommit()) {
    this.commit();
  }
};

GameGUI.prototype.commit = function() {
  if (this.preset.length == 1) {
    this.game.makeMove({p1: this.preset[0]});
  } else {
    this.game.makeMove({p1: this.preset[0], p2: this.preset[1]});
  }
  this.preset = [];
};

GameGUI.prototype.isReadyToCommit = function() {
  if (this.game.turnNumber === 0) {
    return this.preset.length == 1;
  }
  return this.preset.length == 2;
};

GameGUI.prototype.isPresetPosition = function(position) {
  for (var i = 0; i < this.preset.length; ++i) {
    if (isSamePosition(this.preset[i], position)) {
      return true;
    }
  }
  return false;
};

GameGUI.prototype.draw = function() {
  var context = this.canvas.getContext("2d");
  context.drawImage(GameGUI.BOARD, this.x, this.y);
  this.drawPlacedStones();
  this.drawPresetStones();
  this.drawMousePosition();
  this.drawMarkup();
};

GameGUI.prototype.drawPlacedStones = function() {
  var context = this.canvas.getContext("2d");
  for (var i = 0; i < this.game.board.length; ++i) {
    for (var j = 0; j < this.game.board.length; ++j) {
      if (this.game.board[i][j] == this.game.BLACK) {
        this.drawStone({x: i, y: j}, GameGUI.BLACK);
      } else if (this.game.board[i][j] == this.game.WHITE) {
        this.drawStone({x: i, y: j}, GameGUI.WHITE);
      }
    }
  }
};

GameGUI.prototype.drawPresetStones = function() {
  var context = this.canvas.getContext("2d");
  var stone = this.getCurrentStone();
  context.save();
  context.globalAlpha = 0.5;
  for (var i = 0; i < this.preset.length; ++i) {
    this.drawStone(this.preset[i], stone);
  }
  context.restore();
};

GameGUI.prototype.drawMousePosition = function() {
  var context = this.canvas.getContext("2d");
  var stone = this.getCurrentStone();
  context.save();
  context.globalAlpha = 0.25;
  if (this.mousePosition && this.game.isEmptyAt(this.mousePosition) && (this.isPresetPosition(this.mousePosition) || !this.isReadyToCommit())) {
    this.drawStone(this.mousePosition, stone);
  }
  context.restore();
};

GameGUI.prototype.drawMarkup = function() {
  if (this.game.turnNumber === 0) {
    return;
  }
  var markup;
  if (this.game.turn == this.game.BLACK) {
    console.log("wut");
    markup = GameGUI.WHITE_LM;
  } else {
    markup = GameGUI.BLACK_LM;
  }
  var lastMove = this.game.moves[this.game.moves.length - 1];
  console.log(lastMove);
  for (var key in lastMove) {
    console.log(key + " -> " + lastMove[key].x + ", " + lastMove[key].y);
    this.drawStone(lastMove[key], markup);
  }
};

GameGUI.prototype.getCurrentStone = function() {
  if (this.game.turn == this.game.BLACK) {
    return GameGUI.BLACK;
  }
  return GameGUI.WHITE;
};

GameGUI.prototype.drawStone = function(position, image) {
  var context = this.canvas.getContext("2d");
  context.drawImage(image, this.x + (position.x * 25) + 13, this.y + (position.y * 25) + 13);
};

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}