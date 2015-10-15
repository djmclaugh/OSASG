var Connect6GUI = require("./connect6_gui");
var TictactoeGUI = require("./tictactoe_gui");
var Games = require("../../games");

function MatchGUI(matchupId, socket, canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  this.socket = socket;
  this.view = "";
  this.game = null;
  this.id = matchupId;
  
  this.settings = {};
  this.p1Name = null;
  this.p2Name = null;
  this.gameGUI = this.gameGUIForId(matchupId);
  this.isCommiting = false;
  this.mouseTarget = {type:"NULL"};

  this.socket.emit("join", {matchId: matchupId, seat:3});

  this.socket.on("play", this.receivePlay.bind(this));
  this.socket.on("update", this.receiveUpdate.bind(this));
  this.socket.on("error-message", this.receiveError.bind(this));
  
  canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
  canvas.addEventListener('click', this.onMouseClick.bind(this));
}

MatchGUI.prototype.gameGUIForId = function(matchupId) {
  if (matchupId.indexOf("connect6") == 0) {
    return new Connect6GUI(this.canvas);
  } else if (matchupId.indexOf("tictactoe") == 0) {
    return new TictactoeGUI(this.canvas);
  }
  throw new Error("Game type not found for id '" + matchupId + ".");
};

MatchGUI.prototype.receiveError = function(data) {
  console.log("Error after sending '" + data.message + "' (with " + data.data + "): " + data.error);
};

MatchGUI.prototype.receiveUpdate = function(data) {
  this.p1Name = data.p1;
  this.p2Name = data.p2;
  this.gameGUI.createGame(data.gameData);
  this.game = this.gameGUI.game;
};

MatchGUI.prototype.receivePlay = function(data) {
  this.gameGUI.makeMove(data.move);
  this.isCommiting = false;
};

MatchGUI.prototype.onMouseMove = function(event) {
  var rect = this.canvas.getBoundingClientRect();
  var mouseX = event.clientX - rect.left - 0.5;
  var mouseY = event.clientY - rect.top - 0.5;
  if (mouseX <= 500 && this.isMyTurn()) {
    this.gameGUI.onMouseMove(mouseX, mouseY);
  } else {
    this.gameGUI.onMouseOut();
  }
};

MatchGUI.prototype.onMouseOut = function(event) {
  this.gameGUI.onMouseOut();
};

MatchGUI.prototype.onMouseClick = function(event) {
  var rect = this.canvas.getBoundingClientRect();
  var mouseX = event.clientX - rect.left - 0.5;
  var mouseY = event.clientY - rect.top - 0.5;
  if (mouseX <= 500 && this.isMyTurn()) {
    this.gameGUI.onMouseClick(mouseX, mouseY);
  }
  if (mouseX > 500 && mouseY > 400) {
    this.commit();
    this.isCommiting = true;
  }
  if (this.p1Name == null && mouseX > 600 && mouseY > 100 && mouseY < 120) {
    if (this.p2Name == this.socket.session.username) {
      this.socket.emit("request-bot", {matchId: this.id, username: "OSASG-RandomBot"});
    } else {
      this.socket.emit("join", {matchId: this.id, seat: 1});
    }
  }
  if (this.p2Name == null && mouseX > 600 && mouseY > 200 && mouseY < 220) {
    if (this.p1Name == this.socket.session.username) {
      this.socket.emit("request-bot", {matchId: this.id, username: "OSASG-RandomBot"});
    } else {
      this.socket.emit("join", {matchId: this.id, seat: 2});
    }
  }
};

MatchGUI.prototype.isMyTurn = function() {
  if (!this.game || this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    return false;
  }
  if (this.p1Name == this.socket.session.username && this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P1) {
    return true;
  }
  if (this.p2Name == this.socket.session.username && this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P2) {
    return true;
  }
  return false;
};

MatchGUI.prototype.commit = function() {
  this.socket.emit("play", {matchId: this.id, move: this.gameGUI.getMove()});
};

MatchGUI.prototype.draw = function() {
  this.gameGUI.draw(500, 500, 0, 0);
  this.drawControlPanel();
};

MatchGUI.prototype.drawControlPanel = function() {
  this.context.save();
  this.context.fillStyle = "black";
  this.context.font = "bold 16px Arial";
  var status = "";
  if (this.gameGUI.game) {
    status = this.gameGUI.game.getStatus();
  }
  if (status === "" || status == this.game.STATUS_ENUM.UNDECIDED) {
    var p1  = this.p1Name;
    if (!p1) {
      if (this.p2Name == this.socket.session.username) {
        p1 = "CLICK TO ADD BOT";
      } else {
        p1 = "CLICK TO JOIN AS P1";
      }
    }
    var p2  = this.p2Name;
    if (!p2) {
      if (this.p1Name == this.socket.session.username) {
        p2 = "CLICK TO ADD BOT";
      } else {
        p2 = "CLICK TO JOIN AS P2";
      }
    }
    this.context.fillText("P1: " + p1, 550, 120);
    this.context.fillText("P2: " + p2, 550, 220);
  } else if (status == this.game.STATUS_ENUM.P1_WIN) {
    this.context.fillText("Game over!\nBLACK wins!", 570, 200);
  } else if (status == this.game.STATUS_ENUM.P2_WIN) {
    this.context.fillText("Game over!\nWHITE wins!", 570, 200);
  } else if (status == this.game.STATUS_ENUM.DRAW) {
    this.context.fillText("Game over!\nDRAW!", 570, 200);
  }
  var move = this.gameGUI.getMove();
  if (move && !this.isCommiting) {
    this.context.fillText("COMMIT!", 600, 420);
  }
  this.context.restore();
};

module.exports = MatchGUI;
