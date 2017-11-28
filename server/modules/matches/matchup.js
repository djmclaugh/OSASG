var Games = require("./games");
var MatchClock = require("../utilities/timer/match_clock");
var Timers = require("../utilities/timer/timers");
var EventDispatcher = require("../event_dispatcher");

function FailedToJoinMatchError(player, matchup, reason) {
  this.message = "User '" + player.username + "' cannot join matchup '" + matchup.id + "'";
  if (reason) {
    this.message += " because " + reason + ".";
  } else {
    this.message += ".";
  }
  this.stack = (new Error()).stack;
}
FailedToJoinMatchError.prototype = Object.create(Error.prototype);

////////////////////////////////////////

// Possible player messages
const PLAY = "play";
const UPDATE = "update";
const ERROR = "error-message";

// Possible events
const EVENT_UPDATE = "match_event_update"
const EVENT_END = "match_event_end"

function onPlay(match, player) {
  return function(data) {
    if (data.matchID != match.id) {
      return;
    }
    var timestamp = Date.now();
    status = match._getStatus();
    var game = match._game;
    var amP1 = player.isSameUser(match._p1);
    var amP2 = player.isSameUser(match._p2);
    if (status == match.STATUS.NOT_STARTED) {
      player.emit(ERROR, {error: "The game hasn't started yet."});
      return;
    } else if (status == match.STATUS.COMPLETED) {
      player.emit(ERROR, {error: "The game is already over."});
      return;
    } else if (amP1 || amP2) {
      if (data.player == 0 && !amP1) {
        player.emit(ERROR, {error: "You cannot play as P1."});
        return;
      }
      if (data.player == 1 && !amP2) {
        player.emit(ERROR, {error: "You cannot play as P2."});
        return;
      }
      if (typeof data.player == "undefined") {
        if (amP1) {
          data.player = 0;
        } else if (amP2) {
          data.player = 1;
        }
      }
      var error = match._makeMove(data.move, data.player, timestamp);
      if (error) {
        player.emit(ERROR, {error: error});
      }
    } else {
      player.emit(ERROR, {error: "You are not playing in this game."});
    }
  };
}

function Matchup(id, matchSettings) {
  var self = this;
  this.id = id;

  this._settings = matchSettings;
  //this._p1Timer = Timers.newTimer(matchSettings.p1Timer);
  //this._p2Timer = Timers.newTimer(matchSettings.p2Timer);
  //this._clock = new MatchClock(this._p1Timer, this._p2Timer);
  this._game = Games.newGame(matchSettings.gameName, matchSettings.gameSettings);
  this._p1 = null;
  this._p2 = null;
  this._spectators = [];
  // List of players that we are currently listening to for moves.
  this._players = [];
  this._dispatcher = new EventDispatcher();
}

module.exports = Matchup;

Matchup.prototype.MESSAGES = {
  PLAY: PLAY,
  UPDATE: UPDATE,
  ERROR: ERROR
};

Matchup.prototype.STATUS = {
  NOT_STARTED: "NOT_STARTED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED"
};

Matchup.prototype.ERRORS = {
  FAILED_TO_JOIN_MATCH : FailedToJoinMatchError
};

Matchup.prototype.onMatchUpdate = function(callback) {
  return this._dispatcher.on(EVENT_UPDATE, callback);
};

Matchup.prototype.onMatchEnd = function(callback) {
  return this._dispatcher.on(EVENT_END, callback);
};

Matchup.prototype.isCurrentlyPlaying = function(player) {
  return player.isSameUser(this._p1) || player.isSameUser(this._p2);
};

Matchup.prototype.hasStarted = function() {
  return this._p1 != null && this._p2 != null;
};

Matchup.prototype.addPlayer = function(player, seat) {
  if (!player) {
    throw new FailedToJoinMatchError(player, this, "player must not be null");
  }
  if (seat != 1 && seat != 2 && seat != 3) {
    throw new Error("'seat' must be 1, 2, or 3.");
  }
  if (seat == 3) {
    this._addPlayerToSpectators(player, true);
  } else {
    var sittingPlayer = seat == 1 ? this._p1 : this._p2;
    if (!sittingPlayer) {
      this._setPlayer(player, seat);
    } else if (player.isSameUser(sittingPlayer)) {
      this._addPlayerToSpectators(player, true)
    } else {
      // The seat is already taken.
      throw new FailedToJoinMatchError(player, this, "seat " + seat + " is already occupied.");
    }
  }
};

Matchup.prototype.matchInfo = function() {
  var info = {};
  info.matchID = this.id;
  info.gameName = this._settings.gameName;
  info.settings = this._settings;
  info.p1 = this._p1 ? {identifier: this._p1.identifier, username: this._p1.username} : null;
  info.p2 = this._p2 ? {identifier: this._p2.identifier, username: this._p2.username} : null;
  return info;
};

////////// Private

Matchup.prototype._makeMove = function(move, playerNumber, timestamp) {
  var didTurnAdvance = false;
  try {
    didTurnAdvance = this._game.playMove(move, playerNumber);
  } catch (error) {
    return "Error while trying to make a move: " + error.message;
  }
  // Ignore timers for now
  // this._clock.toggle(timestamp);
  if (didTurnAdvance) {
    this._broadcastLatestEvents(timestamp);
    this._checkIfOver();
  }
};

Matchup.prototype._dataForUpdate = function() {
  var data = {};
  data.gameName = this._settings.gameName;
  data.status = this._getStatus();
  data.settings = this._settings;
  // Ignor timers for now
  // data.timers = {
  //   p1: this._p1Timer.exportState(),
  //   p2: this._p2Timer.exportState(),
  // }
  data.players = [];
  if (this._p1) {
    data.players.push({
      username: this._p1.username,
      identifier: this._p1.identifier
    });
  } else {
    data.players.push(null);
  }
  if (this._p2) {
    data.players.push({
      username: this._p2.username,
      identifier: this._p2.identifier
    });
  } else {
    data.players.push(null);
  }
  data.matchID = this.id;
  data.toPlay = Array.from(this._game.getPlayersToPlay());
  return data;
};

Matchup.prototype._addPlayerToSpectators = function(player, shouldSendUpdtate) {
  var self = this;
  if (this._spectators.indexOf(player) == -1) {
    this._spectators.push(player);
  }
  if (player.isSameUser(this._p1) || player.isSameUser(this._p2)) {
    if (this._players.indexOf(player) == -1) {
      player.on(PLAY, onPlay(this, player));
      this._players.push(player);
    }
  }
  player.on("disconnect", function() {
    var index = self._spectators.indexOf(player);
    if (index > -1) {
      self._spectators.splice(self._spectators.indexOf(player), 1);
    }
  });
  if (shouldSendUpdtate) {
    var data = this._dataForUpdate();
    var amP1 = player.isSameUser(this._p1)
    var amP2 = player.isSameUser(this._p2)
    data.updates = this._game.getAllUpdates().map((update) => {
      return updateAsSeenBy(update, amP1, amP2);
    });
    player.emit(UPDATE, data);
  }
};

Matchup.prototype._setPlayer = function(player, seat) {
  if (seat != 1 && seat != 2) {
    throw new Error("'seat' should be 1 or 2.");
  }
  var wasPreviouslyStarted = this.hasStarted();
  if (seat == 1) {
    this._p1 = player;
  } else if (seat == 2) {
    this._p2 = player;
  }
  if (this.hasStarted() && !wasPreviouslyStarted) {
    this._game.start();
    //this._clock.start(Date.now());
    //this._startCheckingTime();
  }
  this._addPlayerToSpectators(player, false);
  this._triggerUpdate();
};

// Notify everyone that the status of this match has changed
Matchup.prototype._triggerUpdate = function() {
  this._broadcastCurrentState();
  this._dispatcher.dispatchEvent(EVENT_UPDATE, this._dataForUpdate());
};

Matchup.prototype._broadcastLatestEvents = function(timestamp) {
  var latestUpdate = this._game.getLatestUpdate();
  var data = {
    matchID: this.id,
    status: this._getStatus(timestamp),
    toPlay: Array.from(this._game.getPlayersToPlay()),
    timestamp: timestamp
  }
  for (var i = 0; i < this._spectators.length; ++i) {
    var spectator = this._spectators[i];
    var amP1 = spectator.isSameUser(this._p1)
    var amP2 = spectator.isSameUser(this._p2)
    // Right now only support 2 player games are supported.
    data.update = updateAsSeenBy(latestUpdate, amP1, amP2);
    spectator.emit(PLAY, data);
  }
}

Matchup.prototype._broadcastCurrentState = function() {
  var events = this._game.getAllUpdates();
  var data = this._dataForUpdate();
  for (var i = 0; i < this._spectators.length; ++i) {
    var spectator = this._spectators[i];
    var amP1 = spectator.isSameUser(this._p1)
    var amP2 = spectator.isSameUser(this._p2)
    data.updates = events.map((currentValue) => {
      return updateAsSeenBy(currentValue, amP1, amP2);
    });
    spectator.emit(UPDATE, data);
  }
}

Matchup.prototype._checkIfOver = function() {
  var timestamp = Date.now();
  var status = this._getStatus(timestamp);
  var result = null;
  if (status == this.STATUS.COMPLETED) {
    var winners = this._game.getWinners();
    if (winners.has(0)) {
      result = "P1";
    } else if (winners.has(1)) {
      result = "P2";
    } else {
      result = "DRAW";
    }
  }
  if (result) {
    this._triggerUpdate();
    this._dispatcher.dispatchEvent(EVENT_END, {result: result});
  }
};

Matchup.prototype._getStatus = function() {
  if (!this.hasStarted()) {
    return this.STATUS.NOT_STARTED;
  }
  return this._game.getPlayersToPlay().size ? this.STATUS.ONGOING :this.STATUS.COMPLETED;
};

function updateAsSeenBy(update, amP1, amP2) {
  if (!update) {
    return null;
  }
  var newUpdate = {
    publicInfo: update.publicInfo
  }
  if (update.privateInfo && (amP1 || amP2)) {
    newUpdate.privateInfo = update.privateInfo.map((currentValue, index) => {
      if (index == 0 && amP1 || index == 1 && amP2) {
        currentValue
      }
      return null;
    });
  }
  return newUpdate;
}