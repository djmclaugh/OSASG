var Games = require("./games");

function Matchup(id) {
  this.id = id;
  this.game = null;
  this.p1 = null;
  this.p2 = null;
  this.hasStarted = false;
  
  this.PLAY_MESSAGE = this.id + "-play";
  this.UPDATE_MESSAGE = this.id + "-update";
  this.ERROR_MESSAGE = this.id + "-error";
}

Matchup.prototype.startMatch = function() {
  var data = {};
  data.gameData = this.game.generateGameData();
  data.names = [this.p1.session.username, this.p2.session.username];
  data.view = "P1";
  this.p1.emit(this.UPDATE_MESSAGE, data);
  data.view = "P2";
  this.p2.emit(this.UPDATE_MESSAGE, data);
  this.hasStarted = true;
}

Matchup.prototype.receiveP1Move = function(move) {
  if (this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P1) {
    try {
      this.game.makeMove(move);
      this.p1.in(this.id).emit(this.PLAY_MESSAGE, move);
    } catch (error) {
      this.p1.emit(this.ERROR_MESSAGE, error);
    }
    this.checkIfOver();
  } else {
    this.p1.emit(this.ERROR_MESSAGE, new Error("It isn't your turn to play yet."));
  }
};

Matchup.prototype.receiveP2Move = function(move) {
  if (this.game.whosTurnIsIt() == this.game.PLAYER_ENUM.P2) {
    try {
      this.game.makeMove(move);
      this.p2.in(this.id).emit(this.PLAY_MESSAGE, move);
    } catch (error) {
      this.p2.emit(this.ERROR_MESSAGE, error);
    }
    this.checkIfOver();
  } else {
    this.p2.emit(this.ERROR_MESSAGE, new Error("It isn't your turn to play yet."));
  }
};

Matchup.prototype.checkIfOver = function() {
  if (this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    // TODO(djmcl): Save game to database or something.
    this.onFinish();
  }
}


Matchup.prototype.setP1 = function(p1) {
  this.p1 = p1;
  p1.join(this.id);
  p1.on(this.PLAY_MESSAGE, this.receiveP1Move.bind(this));
  if (!this.hasStarted && this.p1 && this.p2) {
    this.startMatch();
  }
  this.sendUpdate(p1);
};

Matchup.prototype.setP2 = function(p2) {
  this.p2 = p2;
  p2.join(this.id);
  p2.on(this.PLAY_MESSAGE, this.receiveP2Move.bind(this));
  if (!this.hasStarted && this.p1 && this.p2) {
    this.startMatch();
  }
  this.sendUpdate(p2);
};

Matchup.prototype.addSpectator = function(spectator) {
  spectator.join(this.id);
  this.sendUpdate(spectator);
};

Matchup.prototype.sendUpdate = function(user) {
  if (this.hasStarted) {
    var data = {};
    data.gameData = this.game.generateGameData();
    data.names = [this.p1.session.username, this.p2.session.username];
    data.view = "SPECTATOR";
    if (user == this.p1) {
      data.view = "P1";
    } else if (user == this.p2) {
      data.view = "P2";
    }
    user.emit(this.UPDATE_MESSAGE, data);
  }
}

////////////////////////////////////////

function GameManager() {
  this.matchups = [];
  this.counter = 0;
}

GameManager.prototype.automatchPlayer = function(player, gameTitle) {
  // Reconnect to game.
  for (var i = 0; i < this.matchups.length; ++i) {
    var matchup = this.matchups[i];
    if (matchup.id.indexOf(gameTitle) == 0) {
      if (matchup.p1 && matchup.p1.session.username == player.session.username) {
        player.emit("join", matchup.id);
        matchup.setP1(player);
        return;
      }
      if (matchup.p2 && matchup.p2.session.username == player.session.username) {
        player.emit("join", matchup.id);
        matchup.setP2(player);
        return;
      }
    }
  }
  // Find open game
  for (var i = 0; i < this.matchups.length; ++i) {
    var matchup = this.matchups[i];
    if (matchup.id.indexOf(gameTitle) == 0) {
      if (matchup.p1 == null) {
        player.emit("join", matchup.id);
        matchup.setP1(player);
        return;
      }
      if (matchup.p2 == null) {
        player.emit("join", matchup.id);
        matchup.setP2(player);
        return;
      }
    }
  }
  // Make new game
  var matchup = this.createNewMatchup(gameTitle, {});
  player.emit("join", matchup.id);
  matchup.setP1(player);
}

GameManager.prototype.createNewMatchup = function(gameTitle, settings) {
  var self = this;
  var matchup = new Matchup(gameTitle + "_" + this.counter)
  ++this.counter;
  matchup.game = Games.newGame(gameTitle, settings);
  matchup.onFinish = function() {
    var index = self.matchups.indexOf(matchup);
    self.matchups.splice(index, 1);
  }
  this.matchups.push(matchup);
  return matchup;
};

module.exports = GameManager;
