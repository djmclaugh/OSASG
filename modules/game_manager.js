var Games = require("./games");

function FailedToJoinMatchupError(user, matchup, reason) {
  this.message = "User '" + user.sesison.username + "' cannot join matchup '" + matchup.id + "'";
  if (reason) {
    this.message += " because " + reason + ".";
  } else {
    this.message += ".";
  }
  this.stack = (new Error()).stack;
}
FailedToJoinMatchupError.prototype = Object.create(Error.prototype);

function FailedToSpectateMatchupError(user, matchup) {
  this.message = "User '" + user.sesison.username + "' cannot spectate matchup '" + matchup.id + "'.";
  this.stack = (new Error()).stack;
}
FailedToSpectateMatchupError.prototype = Object.create(Error.prototype);

function NonexistentMatchupError(id) {
  this.message = "Matchup '" + id + "' does not exist.";
  this.stack = (new Error()).stack;
}
NonexistentMatchupError.prototype = Object.create(Error.prototype);

////////////////////////////////////////

function Matchup(id, game, privateUsers) {
  // The id of the game. A string of the form GameTitle_#.
  this.id = id;
  // The actual game object that keeps track of the game.
  this.game = game;
  // The socket for p1.
  this.p1 = null;
  // the socket for p2.
  this.p2 = null;
  // True if and only if the game has started (both p1 and p2 have joined).
  this.hasStarted = false;
  // List of usernames that can interact with this matchup. If null, this matchup is public.
  this.privateUsers = privateUsers
  
  // {id, move}
  this.PLAY_MESSAGE = "matchup-play";
  // {id, gameData, names, view}
  this.UPDATE_MESSAGE = "matchup-update";
  // {id, error}
  this.ERROR_MESSAGE = "matchup-error";
}

Matchup.prototype.canSpectate = function(user) {
  var username = user.session.username;
  return this.privateUsers == null || this.privateUsers.indexOf(user.session.username) != -1;
}

Matchup.prototype.canJoin = function(user) {
  return this.canSpectate(user) && this.hasEmptySeat();
}

Matchup.prototype.hasEmptySeat = function() {
  return !this.p1 || !this.p2
}

Matchup.prototype.startMatch = function() {
  var data = {};
  data.id = this.id;
  data.gameData = this.game.generateGameData();
  data.names = [this.p1.session.username, this.p2.session.username];
  data.view = "P1";
  this.p1.emit(this.UPDATE_MESSAGE, data);
  data.view = "P2";
  this.p2.emit(this.UPDATE_MESSAGE, data);
  this.hasStarted = true;
};

Matchup.prototype.receiveP1Move = function(data) {
  this.receiveMove(data, this.game.PLAYER_ENUM.P1);
};

Matchup.prototype.receiveP2Move = function(data) {
  this.receiveMove(data, this.game.PLAYER_ENUM.P2);
};

Matchup.prototype.receiveMove = function(data, PLAYER) {
  if (data.id != this.id) {
    return;
  }
  var move = data.move;
  var playerSocket = (PLAYER == this.game.PLAYER_ENUM.P1) ? this.p1 : this.p2;
  if (this.game.whosTurnIsIt() != PLAYER) {
    playerSocket.emit(this.ERROR_MESSAGE, {id: this.id, error: new Error("It isn't your turn to play yet.")});
    return;
  }
  try {
    this.game.makeMove(move);
  } catch (error) {
    playerSocket.emit(this.ERROR_MESSAGE, {id: this.id, error: error});
    return;
  }
  playerSocket.in(this.id).emit(this.PLAY_MESSAGE, {id:this.id, move:move});
  this.checkIfOver();
}

Matchup.prototype.checkIfOver = function() {
  if (this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    // TODO(djmcl): Save game to database or something.
    this.onFinish();
  }
};

Matchup.prototype.addPlayer = function(player) {
  var username = player.session.username;
  if (!this.canSpectate(player)) {
    throw new FailedToJoinMatchupError(player, this, "this is a private game");
  }
  // Check if the user is already part of the matchup and is just trying to reconnect.
  if (this.p1 && this.p1.session.username == username) {
    this.setP1(player);
    return;
  }
  if (this.p2 && this.p2.session.username == username) {
    this.setP2(player);
    return;
  }
  // Otherwise, just add the user in the first available position
  if (this.p1 == null) {
    this.setP1(player);
    return;
  }
  if (this.p2 == null) {
    this.setP2(player);
    return;
  }
  throw new FailedToJoinMatchupError(player, this, "both seats are already taken");
}

Matchup.prototype.setP1 = function(p1) {
  this.p1 = p1;
  p1.join(this.id);
  p1.on(this.PLAY_MESSAGE, this.receiveP1Move.bind(this));
  if (!this.hasStarted && !this.hasEmptySeat()) {
    this.startMatch();
  }
  this.sendUpdate(p1);
};

Matchup.prototype.setP2 = function(p2) {
  this.p2 = p2;
  p2.join(this.id);
  p2.on(this.PLAY_MESSAGE, this.receiveP2Move.bind(this));
  if (!this.hasStarted && !this.hasEmptySeat()) {
    this.startMatch();
  }
  this.sendUpdate(p2);
};

Matchup.prototype.addSpectator = function(spectator) {
  if (this.canSpectateList != null && this.canSpectateList.indexOf(player.session.username) == -1 ) {
    throw new FailedToSpectateMatchupError(player, this);
  }
  spectator.join(this.id);
  this.sendUpdate(spectator);
};

Matchup.prototype.removeSpectator = function(spectator) {
  spectator.leave(this.id);
}

Matchup.prototype.sendUpdate = function(user) {
  if (this.hasStarted) {
    var data = {};
    data.id = this.id;
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
};

////////////////////////////////////////

function GameManager() {
  this.matchups = [];
  this.counter = 0;
}

GameManager.prototype.ERRORS = {
  FAILED_TO_JOIN_MATCHUP: FailedToJoinMatchupError,
  FAILED_TO_SPECTATE_MATCHUP: FailedToSpectateMatchupError,
  NONEXISTENT_MATCHUP: NonexistentMatchupError
};

GameManager.prototype.getMatchupById = function(matchupId) {
  for (var i = 0; i < this.matchups.length; ++i) {
    if (this.matchups[i].id == gameId) {
      return this.matchups[i];
    }
  }
  return null;
}

GameManager.prototype.getMatchesUserCanSpectate = function(user) {
  return this.matchups.filter(function(matchup) {
    return matchup.canSpectate(user);
  });
};

GameManager.prototype.getMatchesUserCanJoin = function(user) {
  return this.matchups
      .filter(function(matchup) {
        return matchup.canJoin(user);
      });
};

GameManager.prototype.addToMatchup = function(matchupId, player) {
  var matchup = this.getMatchupById(matchupId);
  if (matchup == null) {
    throw new NonexistentMatchupError(matchupId);
  }
  matchup.addPlayer(player);
};

GameManager.prototype.automatchPlayer = function(player, gameTitle) {
  // Find open game
  for (var i = 0; i < this.matchups.length; ++i) {
    var matchup = this.matchups[i];
    if (matchup.id.indexOf(gameTitle) == 0) {
      if (matchup.canJoin(player)) {
        matchup.addPlayer(player);
        return;
      }
    }
  }
  // Make new game
  var matchup = this.createNewMatchup(gameTitle, {}, null);
  matchup.addPlayer(player);
};

GameManager.prototype.createNewMatchup = function(gameTitle, gameSettings, privateUsers) {
  var self = this;
  var matchup = new Matchup(gameTitle + "_" + this.counter, Games.newGame(gameTitle, gameSettings), privateUsers)
  ++this.counter;
  matchup.onFinish = function() {
    var index = self.matchups.indexOf(matchup);
    self.matchups.splice(index, 1);
  };
  this.matchups.push(matchup);
  return matchup;
};

module.exports = GameManager;
