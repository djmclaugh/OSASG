if (!window['OSASG'].Connect6) {
  console.log("Please include javascript/games/connect6.js before including this file!");
} else {
  var Connect6 = window['OSASG'].Connect6;
}

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
  
  this.game_status = {result: "NOTHING", win: [{x:-1, y:-1}, {x:-1, y:-1}]};
  
  this.socket.on("init", this.receiveInitData.bind(this));
  
  canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
  canvas.addEventListener('click', this.onMouseClick.bind(this));
}

GameGUI.prototype.receiveInitData = function(data) {
  this.names = data.names;
  this.settings = data.setting;
  if (data.view == "BLACK" || data.view == "WHITE") {
    this.startAs(data.view);
  }
  if (data.view == "SPECTATOR") {
    this.spectate(data.gameData);
  }
};

GameGUI.prototype.startAs = function(colour) {
  this.view = colour;
  this.game = new Connect6(this.settings);
  this.socket.removeAllListeners("init");
  this.socket.on("play", this.receiveMove.bind(this));
};

GameGUI.prototype.spectate = function(gameData) {
  this.view = "SPECTATOR";
  this.game = new Connect6(this.settings);
  this.game.init(gameData);
  this.socket.removeAllListeners("init");
  this.socket.on("play", this.receiveMove.bind(this));
};

GameGUI.prototype.startLocal = function() {
  this.view = "LOCAL";
  this.names = ["Black", "White"];
  this.game = new Connect6(this.settings);
  this.socket.removeAllListeners("init");
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
  if (!this.game.isEmptyAt(p)) {
    return;
  }
  if (this.getPresetPosition(p) >= 0) {
    this.mouseTarget = {type: "PRESET", index: this.getPresetPosition(p)};
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
    this.performMove({p1: this.preset[0]});
  } else {
    this.performMove({p1: this.preset[0], p2: this.preset[1]});
  }
  this.preset = [];
};

GameGUI.prototype.receiveMove = function(move) {
  this.performMove(move);
};

GameGUI.prototype.commit = function() {
  var move;
  if (this.preset.length == 1) {
    move = {p1: this.preset[0]};
  } else {
    move = {p1: this.preset[0], p2: this.preset[1]};
  }
  this.game.makeMove(move);
  this.game_status = this.game.getStatusAfterLastMove();
  this.preset = [];
  this.socket.emit("play", move);
};

GameGUI.prototype.performMove = function(move) {
  this.game.makeMove(move);
  this.game_status = this.game.getStatusAfterLastMove();
};

GameGUI.prototype.isReadyToCommit = function() {
  if (this.game.turnNumber === 0) {
    return this.preset.length == 1;
  }
  return this.preset.length == 2;
};

GameGUI.prototype.getPresetPosition = function(position) {
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
  }
  this.drawCP();
};

GameGUI.prototype.drawWin = function(win_line) {
  this.context.lineWidth = 2;
  this.context.strokeStyle = "black";
  this.context.lineCap = "round";
  this.context.beginPath();
  this.context.moveTo(25.5 + (25 * win_line[0].x), 25.5 + (25 * win_line[0].y));
  this.context.lineTo(25.5 + (25 * win_line[1].x), 25.5 + (25 * win_line[1].y));
  this.context.stroke();    
};

GameGUI.prototype.drawCP = function() {
  this.context.fillStyle = "black";
  this.context.font = "bold 16px Arial";
  if (this.view === "") {
    this.context.fillText("Waiting to be matched!", 570, 200);
  } else if (this.game_status.result == "WIN") {
    if (this.game.turnNumber % 2 === 0) {
      this.context.fillText("Game over!\nWHITE wins!", 570, 200);
    } else {
      this.context.fillText("Game over!\nBLACK wins!", 570, 200);
    }
    this.drawWin(this.game_status.win);
  } else if (this.game_status.result == "RESIGN") {
    if (this.game_status.who == "BLACK") {
      this.context.fillText("BLACK resigned!\nWHITE wins!", 570, 200);
    } else {
      this.context.fillText("WHITE resigned!\nBLACK wins!", 570, 200);
    }
  } else {
    this.context.drawImage(GameGUI.BLACK, 600, 100);
    this.context.fillText(this.names[0], 630, 120);
    this.context.drawImage(GameGUI.WHITE, 600, 200);
    this.context.fillText(this.names[1], 630, 220);
  }
};

GameGUI.prototype.drawPlacedStones = function() {
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
  if (this.game.turn == this.game.BLACK) {
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
  if (this.game.turn == this.game.BLACK) {
    return GameGUI.BLACK;
  }
  return GameGUI.WHITE;
};

GameGUI.prototype.drawStone = function(position, image) {
  this.context.drawImage(image, (position.x * 25) + 13, (position.y * 25) + 13);
};

GameGUI.prototype.isMyTurn = function() {
  if (this.game_status.result != "NOTHING") {
    return false;
  }
  if (this.view == "LOCAL") {
    return true;
  }
  if (this.view == "BLACK" && this.game.turn == this.game.BLACK) {
    return true;
  }
  if (this.view == "WHITE" && this.game.turn == this.game.WHITE) {
    return true;
  }
  return false;
};

function isSamePosition(p1, p2) {
  return p1.x == p2.x && p1.y == p2.y;
}