var Game = require("./games/game");
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
    var timestamp = Date.now();
    if (data.matchId != match.id) {
      return;
    }
    status = match._getStatus(timestamp);
    var game = match._game;
    if (status == match.STATUS.NOT_STARTED) {
      player.emit(ERROR, {error: "The game hasn't started yet."});
      return;
    } else if (status == match.STATUS.P1_WIN
          || status == match.STATUS.P2_WIN
          || status == match.STATUS.DRAW) {
      player.emit(ERROR, {error: "The game is already over."});
      return;
    } else if ((status == match.STATUS.P1_TO_PLAY && player.isSameUser(match._p1))
        || (status == match.STATUS.P2_TO_PLAY && player.isSameUser(match._p2))) {
      var error = match._makeMove(data.move, timestamp);
      if (error) {
        player.emit(ERROR, {error: error});
      }
    } else if (player.isSameUser(match._p1)) {
      if (status == match.STATUS.P1_OUT_OF_TIME) {
        player.emit(ERROR, {error: "Move received after time ran out."});
      } else {
        player.emit(ERROR, {error: "It isn't your turn to play."});
      }
    } else if (player.isSameUser(match._p2)) {
      if (status == match.STATUS.P2_OUT_OF_TIME) {
        player.emit(ERROR, {error: "Move received after time ran out."});
      } else {
        player.emit(ERROR, {error: "It isn't your turn to play."});
      }
    } else {
      player.emit(ERROR, {error: "You are not playing in this game."});
    }
  };
}

function Matchup(id, gameTitle, settings) {
  var self = this;
  this.id = id;

  this._settings = settings;
  this._p1Timer = Timers.newTimer(settings.p1Timer);
  this._p2Timer = Timers.newTimer(settings.p2Timer);
  this._clock = new MatchClock(this._p1Timer, this._p2Timer);
  this._game = Games.newGame(gameTitle, settings.gameSettings);
  this._gameTitle = gameTitle;
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
  P1_TO_PLAY: Game.prototype.STATUS.P1_TO_PLAY,
  P2_TO_PLAY: Game.prototype.STATUS.P2_TO_PLAY,
  P1_WIN: Game.prototype.STATUS.P1_WIN,
  P2_WIN: Game.prototype.STATUS.P2_WIN,
  P1_OUT_OF_TIME: "P1_OUT_OF_TIME",
  P2_OUT_OF_TIME: "P2_OUT_OF_TIME",
  DRAW: Game.prototype.STATUS.DRAW
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
  return this._dataForUpdate();
}

////////// Private

Matchup.prototype._makeMove = function(move, timestamp) {
  try {
    this._game.makeMove(move);
  } catch (error) {
    return "Error while trying to make a move: " + error.message;
  }
  this._clock.toggle(timestamp);
  this._broadcast(PLAY, {
        matchId: this.id,
        move: move,
        timestamp: timestamp,
        status: this._getStatus(timestamp)});
  this._checkIfOver();
};

Matchup.prototype._dataForUpdate = function() {
  var data = {};
  data.status = this._getStatus();
  data.gameData = this._game.generateGameData();
  data.settings = this._settings;
  data.timers = {
    p1: this._p1Timer.exportState(),
    p2: this._p2Timer.exportState(),
  }
  if (this._p1) {
    data.p1 = {
      username: this._p1.username,
      identifier: this._p1.identifier
    };
  } else {
    data.p1 = null;
  }
  if (this._p2) {
    data.p2 = {
      username: this._p2.username,
      identifier: this._p2.identifier
    };
  } else {
    data.p2 = null;
  } 
  data.matchId = this.id;
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
    self._spectators.splice(self._spectators.indexOf(player), 1);
  });
  if (shouldSendUpdtate) {
    player.emit(UPDATE, this._dataForUpdate());
  }
};

Matchup.prototype._setPlayer = function(player, seat) {
  if (seat != 1 && seat != 2) {
    throw new Error("'seat' should be 1 or 2.");
  }
  if (seat == 1) {
    this._p1 = player;
  } else if (seat == 2) {
    this._p2 = player;
  }
  if (this.hasStarted() && !this._clock.hasStarted()) {
    this._clock.start(Date.now());
    this._startCheckingTime();
  }
  this._addPlayerToSpectators(player, false);
  this._triggerUpdate();
};

// Notify everyone that the status of this match has changed
Matchup.prototype._triggerUpdate = function() {
  var updateObject = this._dataForUpdate();
  this._broadcast(UPDATE, updateObject);
  this._dispatcher.dispatchEvent(EVENT_UPDATE, updateObject);
};

Matchup.prototype._broadcast = function(message, data) {
  for (var i = 0; i < this._spectators.length; ++i) {
    this._spectators[i].emit(message, data);
  }
};

Matchup.prototype._checkIfOver = function() {
  var timestamp = Date.now();
  var status = this._getStatus(timestamp);
  var result = null;
  if (status == this.STATUS.P1_WIN || status == this.STATUS.P2_OUT_OF_TIME) {
    result = "P1";
  } else if (status == this.STATUS.P2_WIN || status == this.STATUS.P1_OUT_OF_TIME) {
    result = "P2";
  } else if (status == this.STATUS.DRAW) {
    result = "DRAW";
  }
  if (result) {
    this._clock.stop(timestamp)
    clearInterval(this._checkTimeIntervalId);
    this._triggerUpdate();
    this._dispatcher.dispatchEvent(EVENT_END, {result: result});
  }
};

Matchup.prototype._startCheckingTime = function() {
  this._checkTimeIntervalId = setInterval(checkTime.bind(this), 1000);
};

function checkTime() {
  this._checkIfOver();
}

Matchup.prototype._getStatus = function(timestamp) {
  if (!this.hasStarted()) {
    return this.STATUS.NOT_STARTED;
  }
  var status = this._game.getStatus();
  if (this._clock.currentPlayerIsOutOfTime(timestamp)) {
    if (status == this.STATUS.P1_TO_PLAY) {
      return this.STATUS.P1_OUT_OF_TIME; 
    } else if (status == this.STATUS.P2_TO_PLAY) {
      return this.STATUS.P2_OUT_OF_TIME
    }
  }
  return status;
};
