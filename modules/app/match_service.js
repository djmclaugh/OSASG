var Games = require("../games");

module.exports = ["SocketService", function(SocketService) {
  var self = this;
  var matches = {};

  // Match class
  function Match(matchId) {
    this.id = matchId;
    this.p1 = null;
    this.p2 = null;
    this.game = Games.newGameFromId(matchId);
    this.getMoveDelegate = null;
    this.onChangeCallbacks = [];
    this.onReadyToCommit = [];
  }
  
  Match.prototype.onChange = function(callback) {
    this.onChangeCallbacks.push(callback);
  };

  Match.prototype.isMyTurn = function() {
    if (!this.p1 || !this.p2 || this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
      return false;
    }
    if (this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P1) {
      return SocketService.session.username == this.p1;
    } else {
      return SocketService.session.username == this.p2;
    }
  }

  Match.prototype.receiveMove = function(move) {
    this.game.makeMove(move);
    for (var i = 0; i < this.onChangeCallbacks.length; ++i) {
      this.onChangeCallbacks[i]();
    }
    console.log(this.game.getStatus());
    console.log(this.game.STATUS_ENUM.UNDECIDED);
  };

  Match.prototype.update = function(data) {
    this.p1 = data.p1;
    this.p2 = data.p2;
    this.game.initFromGameData(data.gameData);
    for (var i = 0; i < this.onChangeCallbacks.length; ++i) {
      this.onChangeCallbacks[i]();
    }
  };
  
  
  Match.prototype.isReadyToCommit = function() {
    return this.getMoveDelegate && this.getMoveDelegate.getMove();
  };

  Match.prototype.submitMove = function() {
    var move = this.getMoveDelegate ? this.getMoveDelegate.getMove() : null;
    if (move != null) {
      SocketService.emit("play", {matchId: this.id, move: move});
    }
  };

  Match.prototype.requestBot = function(botName, seat) {
    SocketService.emit("request-bot", {matchId: this.id, username: botName});
  };

  Match.prototype.sit = function(seat) {
    SocketService.emit("join", {matchId: this.id, seat: seat});
  };
  // Match class end.

  SocketService.on("play", function(data) {
    matches[data.matchId].receiveMove(data.move);
  });

  SocketService.on("update", function(data) {
    matches[data.matchId].update(data);
  });

  self.getMatch = function(matchId) {
    if (!matches[matchId]) {
      matches[matchId] = new Match(matchId);
      SocketService.emit("join", {matchId: matchId, seat: 3});
    }
    return matches[matchId];
  }
}];
