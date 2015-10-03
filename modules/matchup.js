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
  this.id = id;
  this.game = Games.newGame(gameTitle, gameSettings);
  this.p1Username = null;
  this.p2Username = null;
  // List of usernames that can interact with this matchup. If null, this matchup is public.
  this.privateUsers = privateUsers
  
  this.onFinish = function() {};
}

Matchup.prototype.MESSAGES = {
  // server receives -> server responds
  // -> server emits to the client only
  // => server broadcasts to the whole room

  // {seat:(1 or 2)} => UPDATE
  // -> ERROR if seat taken
  SIT: "matchup-sit",
  // {} => UPDATE
  // -> ERROR if not seated or match has already started.
  STAND:  "matchup-stand",
  // {} => UPDATE
  // -> ERROR if not playing or match has not started.
  RESIGN: "matchup-resign",
  // {move} => {move}
  // -> ERROR if playing out of turn or illegal move.
  PLAY:   "matchup-play",
  // {} -> {gameData, p1, p2}
  UPDATE: "matchup-update",
  // Server cannot receive ERROR messages, it only sends them.
  // {message_that_triggered_the_error, data_associated_with_it, error_message}
  ERROR:  "matchup-error"
};

Matchup.prototype.ERRORS = {
  FAILED_TO_JOIN_MATCHUP: FailedToJoinMatchupError
}

Matchup.prototype.canJoin = function(username) {
  return this.privateUsers == null || this.privateUsers.indexOf(username) != -1;
}

Matchup.prototype.hasStarted = function() {
  return this.p1Username != null && this.p2Username != null;
}

Matchup.prototype.checkIfOver = function() {
  if (this.game.getStatus() != this.game.STATUS_ENUM.UNDECIDED) {
    // TODO(djmclaugh): Save game to database or something.
    this.onFinish();
  }
};

Matchup.prototype.addPlayer = function(player) {
  var username = player.session.username;
  if (!this.canJoin(username)) {
    throw new FailedToJoinMatchupError(player, this, "this is a private game");
  }
  player.join(this.id);
  player.on(this.MESSAGES.SIT, onSit(this, player));
  player.on(this.MESSAGES.STAND, onStand(this, player));
  player.on(this.MESSAGES.RESIGN, onResign(this, player));
  player.on(this.MESSAGES.PLAY, onPlay(this, player));
  player.on(this.MESSAGES.UPDATE, onUpdate(this, player));
  player.emit(this.MESSAGES.UPDATE, this.dataForUpdate());
};

Matchup.prototype.dataForUpdate = function() {
  var data = {};
  data.gameData = this.game.generateGameData();
  data.p1 = this.p1Username;
  data.p2 = this.p2Username;
  return data;
};

function onSit(matchup, player) {
  return function(data) {
    if (!data.seat || (data.seat != 1 && data.seat != 2)) {
      player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.SIT, data: data, error: "'seat' must be 1 or 2."});
      return;
    }
    var username = player.session.username;
    if (username == matchup.p1Username || username == matchup.p2Username) {
      player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.SIT, data: data, error: "You are already sitting at this match."});
      return;
    }
    if (data.seat == 1) {
      if (matchup.p1Username != null) {
        player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.SIT, data: data, error: "The P1 seat is already taken."});
        return;
      } else {
        matchup.p1Username = username;
        player.server.in(matchup.id).emit(matchup.MESSAGES.UPDATE, matchup.dataForUpdate());
        return;
      }
    } else if (data.seat == 2) {
      if (matchup.p2Username != null) {
        player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.SIT, data: data, error: "The P2 seat is already taken."});
        return;
      } else {
        matchup.p2Username = username;
        player.server.in(matchup.id).emit(matchup.MESSAGES.UPDATE, matchup.dataForUpdate());
        return;
      }
    }
  };
}

function onStand(matchup, player) {
  return function(data) {
    if (matchup.hasStarted()) {
      player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.LEAVE, data: data,
          error: "You cannot stand up once the game has started. You must resign if you want to leave."});
    }
    var username = player.session.username;
    if (username == matchup.p1Username) {
      matchup.p1 = null;
      player.server.in(matchup.id).emit(matchup.MESSAGES.UPDATE, matchup.dataForUpdate());
    } else if (username == matchup.p2Username) {
      matchup.p2 = null;
      player.server.in(matchup.id).emit(matchup.MESSAGES.UPDATE, matchup.dataForUpdate());
    } else {
      player.emit(matchup.MESSAGES.ERROR, {matchup: matchup.MESSAGES.LEAVE, data: data, error: "You are not even sitting."});
    }
  };
}

function onResign(matchup, player) {
  return function(data) {
    // TODO(djmclaugh)
    player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.RESIGN, data: data, error: "'RESIGN' has not been implemented yet..."});
  };
}

function onPlay(matchup, player) {
  return function(data) {
    if (!matchup.hasStarted()) {
      player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.PLAY, data: data, error: "The game hasn't started yet."});
      return;
    }
    var username = player.session.username;
    var game = matchup.game;
    if ((game.whosTurnIsIt() == game.PLAYER_ENUM.P1 && matchup.p1Username == username) ||
        (game.whosTurnIsIt() == game.PLAYER_ENUM.P2 && matchup.p2Username == username)) {
      try {
        game.makeMove(data.move);
      } catch (error) {
        player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.PLAY, data: data, error: error.message});
        return;
      }
      player.server.in(matchup.id).emit(matchup.MESSAGES.PLAY, {move:data.move});
      matchup.checkIfOver();
    } else {
      player.emit(matchup.MESSAGES.ERROR, {message: matchup.MESSAGES.PLAY, data: data, error: "It isn't your turn to play."});
    }
  };
}

function onUpdate(matchup, player) {
  return function(data) {
    player.emit(matchup.MESSAGES.UPDATE, matchup.dataForUpdate());
  };
}

module.exports = Matchup;
