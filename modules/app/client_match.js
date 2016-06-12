var Games = require("../matches/games");
var Timers = require("../utilities/timer/timers");

function ClientMatch(matchId, socket) {
  this.id = matchId;
  this.socket = socket;
  this.p1Timer = null;
  this.p2Timer = null;
  this.p1 = null;
  this.p2 = null;
  this.availableBot = [];
  this.game = Games.newGameFromId(matchId);
  this.getMoveDelegate = null;
  this.onChangeCallbacks = [];
}

module.exports = ClientMatch;
  
ClientMatch.prototype.onChange = function(callback) {
  this.onChangeCallbacks.push(callback);
};

ClientMatch.prototype.isMyTurn = function() {
  if (!this.p1 || !this.p2 || this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    return false;
  }
  if (this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P1) {
    return this.socket.session.identifier == this.p1.identifier;
  } else {
    return this.socket.session.identifier == this.p2.identifier;
  }
};

ClientMatch.prototype.receiveMove = function(move, timestamp) {
  this.game.makeMove(move);
  if (this.p1Timer.isRunning) {
    this.p1Timer.stop(timestamp);
    this.p2Timer.start(timestamp);
  } else {
    this.p1Timer.start(timestamp);
    this.p2Timer.stop(timestamp);
  }
  for (var i = 0; i < this.onChangeCallbacks.length; ++i) {
    this.onChangeCallbacks[i]();
  }
};

ClientMatch.prototype.update = function(data) {
  this.p1 = data.p1;
  this.p2 = data.p2;
  this.game.initFromGameData(data.gameData);
  this.p1Timer = Timers.newTimer(data.settings.p1Timer);
  this.p1Timer.importState(data.timers.p1);
  this.p2Timer = Timers.newTimer(data.settings.p1Timer);
  this.p2Timer.importState(data.timers.p2);
  for (var i = 0; i < this.onChangeCallbacks.length; ++i) {
    this.onChangeCallbacks[i]();
  }
};
    
ClientMatch.prototype.isReadyToCommit = function() {
  return this.getMoveDelegate && this.getMoveDelegate.getMove() !== null;
};

ClientMatch.prototype.submitMove = function() {
  var move = this.getMoveDelegate ? this.getMoveDelegate.getMove() : null;
  if (move != null) {
    this.socket.emit("play", {matchId: this.id, move: move});
  }
};

ClientMatch.prototype.requestBot = function(botId, seat) {
  this.socket.emit("api-invite-player", {matchId: this.id, playerId: botId, seat: seat});
};

ClientMatch.prototype.sit = function(seat) {
  this.socket.emit("api-join-match", {matchId: this.id, seat: seat});
};

