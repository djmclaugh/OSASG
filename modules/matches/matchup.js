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
    if (!match.hasStarted()) {
      player.emit(ERROR, {error: "The game hasn't started yet."});
      return;
    }
    var game = match._game;
    if ((game.whosTurnIsIt() == game.PLAYER_ENUM.P1 && player.isSameUser(match._p1)) ||
        (game.whosTurnIsIt() == game.PLAYER_ENUM.P2 && player.isSameUser(match._p2))) {
      if (match._clock.currentPlayerIsOutOfTime(timestamp)) {
        player.emit(ERROR, {error: "Move received after time ran out."});
        return;
      }
      try {
        game.makeMove(data.move);
      } catch (error) {
        player.emit(ERROR, {error: "Error while trying to make a move: " + error.message});
        return;
      }
      match._clock.toggle(timestamp);
      match._broadcast(PLAY, {matchId: match.id, move: data.move, timestamp: timestamp});
      match._checkIfOver();
    } else {
      player.emit(ERROR, {error: "It isn't your turn to play."});
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

Matchup.prototype.MESSAGES = {
  PLAY: PLAY,
  UPDATE: UPDATE,
  ERROR: ERROR
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

Matchup.prototype._dataForUpdate = function() {
  var data = {};
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
  if (this._spectators.indexOf(player) == -1) {
    this._spectators.push(player);
  }
  if (player.isSameUser(this._p1) || player.isSameUser(this._p2)) {
    if (this._players.indexOf(player) == -1) {
      player.on(PLAY, onPlay(this, player));
      this._players.push(player);
    }
  }
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
    this._checkTime();
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
  var status = this._game.getStatus();
  if (status != this._game.STATUS_ENUM.UNDECIDED) {
    var result
    if (status == this._game.STATUS_ENUM.P1_WIN) {
      result = "P1";
    } else if (status == this._game.STATUS_ENUM.P2_WIN) {
      result = "P2";
    } else {
      result = "DRAW";
    }
    clearTimeout(this._timeoutId);
    this._dispatcher.dispatchEvent(EVENT_END, {result: result});
  }
};

Matchup.prototype._checkTime = function() {
  if (this._clock.currentPlayerIsOutOfTime(Date.now())) {
    var result = this._game.whosTurnIsIt() == this._game.PLAYER_ENUM.P1 ? "P2" : "P1";
    this._dispatcher.dispatchEvent(EVENT_END, {result: result});
  } else {
    this._timeoutId = setTimeout(this._checkTime.bind(this), 1000);
  }
};

module.exports = Matchup;
