var Games = require("./games");

function FailedToJoinMatchupError(user, matchup, reason) {
  this.message = "User '" + user.session.username + "' cannot join matchup '" + matchup.id + "'";
  if (reason) {
    this.message += " because " + reason + ".";
  } else {
    this.message += ".";
  }
  this.stack = (new Error()).stack;
}
FailedToJoinMatchupError.prototype = Object.create(Error.prototype);

////////////////////////////////////////

function Matchup(id, gameTitle, gameSettings, privateUsers) {
  var self = this;
  this.id = id;
  this.game = Games.newGame(gameTitle, gameSettings);
  this.p1Username = null;
  this.p2Username = null;
  var spectators = [];
  var players = [];
  // List of usernames that can interact with this matchup. If null, this matchup is public.
  this.privateUsers = privateUsers;
  
  this.onFinish = function() {};
  this.onUpdate = function() {};

  this.broadcast = function(message, data) {
    for (var i = 0; i < spectators.length; ++i) {
      spectators[i].emit(message, data);
    }
  };
  this.addToSpectatorsList = function(player) {
    for (var i = 0; i < spectators.length; ++i) {
      if (spectators[i] == player) {
        // I am already in the spectators list.
        return;
      }
    }
    spectators.push(player);
  };
  this.addToPlayersList = function(player) {
    for (var i = 0; i < players.length; ++i) {
      if (players[i] == player) {
        // I am already in the players list.
        return;
      }
    }
    players.push(player);
    player.on(self.MESSAGES.PLAY, onPlay(self, player));
  };

  this.MESSAGES = {
    JOIN: "join",
    PLAY: "play",
    UPDATE: "update",
    ERROR: "error-message"
  };
}

Matchup.prototype.ERRORS = {
  FAILED_TO_JOIN_MATCHUP: FailedToJoinMatchupError
};

Matchup.prototype.canJoin = function(username) {
  return this.privateUsers == null || this.privateUsers.indexOf(username) != -1;
};

Matchup.prototype.isCurrentlyPlaying = function(username) {
  return this.p1Username == username || this.p2Username == username;
};

Matchup.prototype.hasStarted = function() {
  return this.p1Username != null && this.p2Username != null;
};

Matchup.prototype.checkIfOver = function() {
  if (this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    // TODO(djmclaugh): Save game to database or something.
    this.onFinish();
  }
};

Matchup.prototype.addPlayer = function(player, seat) {  
  var username = player.session.username;
  if (!this.canJoin(username)) {
    throw new FailedToJoinMatchupError(player, this, "this is a private game");
  }
  this.addToSpectatorsList(player);
  if (!seat) {
    // If the user has not specified a seat, let's chose one for them.
    if (this.p1Username == username) {
      seat = 1;
    } else if (this.p2Username == username) {
      seat = 2;
    } else if (!this.p1Username) {
      seat = 1;
    } else if (!this.p2Username) {
      seat = 2;
    } else {
      seat = 3;
    }
  }
  if (seat == 3) {
    // 'player' just wants to spectate.
    player.emit(this.MESSAGES.UPDATE, this.dataForUpdate());
  } else if (seat == 1) {
    if (this.p1Username == username) {
      // 'player' simply wants to reconect. Send them an update of the game.
      this.addToPlayersList(player);
      player.emit(this.MESSAGES.UPDATE, this.dataForUpdate());
    } else if (!this.p1Username) {
      // 'player' wants to join as P1. Make them join and tell everyone.
      this.p1Username = username;
      this.onUpdate();
      this.addToPlayersList(player);
      this.broadcast(this.MESSAGES.UPDATE, this.dataForUpdate());
    } else {
      // The P1 seat is already taken.
      throw new FailedToJoinMatchupError(player, this, "the P1 seat is already occupied");
    }
  } else if (seat == 2) {
    if (this.p2Username == username) {
      // 'player' simply wants to reconect. Send them an update of the game.
      this.addToPlayersList(player);
      player.emit(this.MESSAGES.UPDATE, this.dataForUpdate());
    } else if (!this.p2Username) {
      // 'player' wants to join as P2. Make them join and tell everyone.
      this.p2Username = username;
      this.onUpdate();
      this.addToPlayersList(player);
      this.broadcast(this.MESSAGES.UPDATE, this.dataForUpdate());
    } else {
      // The P2 seat is already taken.
      throw new FailedToJoinMatchupError(player, this, "the P2 seat is already occupied");
    }
  }
};

Matchup.prototype.dataForUpdate = function() {
  var data = {};
  data.gameData = this.game.generateGameData();
  data.p1 = this.p1Username;
  data.p2 = this.p2Username;
  data.matchId = this.id;
  return data;
};

function onPlay(matchup, player) {
  return function(data) {
    if (data.matchId != matchup.id) {
      return;
    }
    if (!matchup.hasStarted()) {
      player.emit(matchup.MESSAGES.ERROR, {error: "The game hasn't started yet."});
      return;
    }
    var username = player.session.username;
    var game = matchup.game;
    if ((game.whosTurnIsIt() == game.PLAYER_ENUM.P1 && matchup.p1Username == username) ||
        (game.whosTurnIsIt() == game.PLAYER_ENUM.P2 && matchup.p2Username == username)) {
      try {
        game.makeMove(data.move);
      } catch (error) {
        player.emit(matchup.MESSAGES.ERROR,
            {error: "Error while trying to make a move: " + error.message});
        return;
      }
      matchup.broadcast(matchup.MESSAGES.PLAY, {matchId:matchup.id, move:data.move});
      matchup.checkIfOver();
    } else {
      player.emit(matchup.MESSAGES.ERROR, {error: "It isn't your turn to play."});
    }
  };
}

module.exports = Matchup;
