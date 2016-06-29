// A player can suscribe to this topic to get updates about the currently active matches.
// Messages on this topic will be of the following form:
// {
//   action: A string representing which of the four actions to perform.
//   matches: An array of match data to use to perform the action.
// }
const ACTIVE_MATCHES = "api-active-matches";
// Used to let the client know about all of the currently active matches.
// 'matches' will contain all of the currently active matches.
const ACTIVE_MATCHES_SET = "set";
// Used to let the client know when a new match is created.
// 'matches' will contain all of the recently added matches.
const ACTIVE_MATCHES_ADD = "add";
// Used to let the client know when a match ended.
// 'matches' will contain all of the recently removed matches.
const ACTIVE_MATCHES_REMOVE = "remove";
// Used to let the client know when a match's status has changed.
// 'matches' will contain all of the recently modified matches.
const ACTIVE_MATCHES_UPDATE = "update";

// A player can suscribe to this topic to get updates about the currently active bots.
// Messages on this topic will be of the following form:
// {
//   action: A string representing which of the four actions to perform.
//   bots: An array of bot data to use to perform the action. 
// }
const ACTIVE_BOTS = "api-active-bots";
// Used to let the client know about all of the currently active bots.
// 'bots' will contain all of the currently active bots.
const ACTIVE_BOTS_SET = "set";
// Used to let the client know when a bot comes online.
// 'bots' will contain all of the bots that recently came online.
const ACTIVE_BOTS_ADD = "add";
// Used to let the client know when a bot goes offline.
// 'bots' will contain all of the bots that recently went offline.
const ACTIVE_BOTS_REMOVE = "remove";
// Used to let the client know when a bot's status has changed.
// 'bots' will contain all of the recently modified bots.
const ACTIVE_BOTS_UPDATE = "update";

// Let's a player join a specific match.
// Messages on this topic will be of the following form:
// {
//   matchId: id of the match the player wants to join.
//   seat: int describing if the user wants to join as p1, p2, or a spectator
//         (1, 2, and 3 respectively). Can be 0 or undefined if the player is responding to an
//         invite. In that case, the invite should contain the seat information. 
// }
const JOIN_MATCH = "api-join-match";

// Let's a player invite another player to some specific match.
// Messages on this topic will be of the following form:
// {
//   matchId: the id for the match the player is invited to join.
//   playerId: the id of the player who is being invited.
//   seat: the seat the inveter wants the invitee to use. 
// }
const INVITE_PLAYER = "api-invite-player";

// Let's a player know if something went wrong.
// Messages on this topic will be of the following form:
// {
//   error: string describing the error.
// }
const ERROR_MESSAGE = "error-message";

const gameManager = require("./matches/game_manager").prototype.getInstance();

var Player = require("./matches/player");
var BotPlayer = require("./bot_player");

function ConnectionHandler(clientServer, botServer) {
  var self = this;

  self.hasStarted = false;
  self.clientServer = clientServer;
  self.botServer = botServer;

  // Map of ALL clients (including bots and guests) that are currently online.
  // Key -> Value : identifier -> array of player objects.
  self._players = {};

  // List of all the bots that are currently online and willing to play.
  self._bots = [];

  // Keeps track of who wants updates about what.
  self._subscribers = {};
  self._subscribers[ACTIVE_MATCHES] = [];
  self._subscribers[ACTIVE_BOTS] = [];
  
  // Keeps track of who has been invited to what.
  self._sentInvites = [];
}

module.exports = ConnectionHandler;

ConnectionHandler.prototype.start = function() {
  var self = this;
  if (self.hasStarted) {
    return;
  }
  self.hasStarted = true;

  self.onMatchAddedCallbackId = gameManager.onMatchAdded(function(match) {
    self._sendMatchInfo(ACTIVE_MATCHES_ADD, match);
  });
  self.onMatchRemovedCallbackId = gameManager.onMatchRemoved(function(match) {
    self._sendMatchInfo(ACTIVE_MATCHES_REMOVE, match);
  });
  self.onMatchUpdatedCallbackId = gameManager.onMatchUpdated(function(match) {
    self._sendMatchInfo(ACTIVE_MATCHES_UPDATE, match);
  });

  self.onClientConnectCallback = function(socket) {
    self.onClientConnect(socket);
  };
  self.clientServer.on("connection", self.onClientConnectCallback);
    
  self.onBotConnectCallbackId = self.botServer.onConnection(function(socket) {
    self.onBotConnect(socket);
  });
};

ConnectionHandler.prototype.stop = function() {
  gameManager.removeListener(this.onMatchAddedCallbackId);
  gameManager.removeListener(this.onMatchRemovedCallbackId);
  gameManager.removeListener(this.onMatchUpdatedCallbackId);
  // TODO(djmclaugh): figure a way to remove the listeners from the socket.io Server object.
  //this.clientServer.removeAllListeners();
  this.botServer.removeListener(this.onBotConnectCallbackId);
};

// Remove all requests older than 5 seconds.
ConnectionHandler.prototype.cleanBotRequests = function() {
  var now  = Date.now();
  while (this.sentBotRequests.length > 0 && now - this.sentBotRequests[0].sentTime > 5000) {
    this.sentBotRequests.splice(0, 1);
  }
};

// Sends a match related message to the appropriate clients.
ConnectionHandler.prototype._sendMatchInfo = function(action, match) {
  var data = {
    action: action,
    matches: [match.matchInfo()]
  };
  var players = this._subscribers[ACTIVE_MATCHES];
  for (var i = 0; i < players.length; ++i) {
    players[i].emit(ACTIVE_MATCHES, data);
  }
};

// Sends a bot related message to the appropriate clients.
ConnectionHandler.prototype._sendBotInfo = function(action, bot) {
  var data = {
    action: action,
    bots: [bot.botInfo()]
  };
  var players = this._subscribers[ACTIVE_BOTS];
  for (var i = 0; i < players.length; ++i) {
    players[i].emit(ACTIVE_BOTS, data);
  }
};

ConnectionHandler.prototype._subscribePlayerToActiveMatches = function(player) {
  this._subscribers[ACTIVE_MATCHES].push(player);
  matches = gameManager.getMatchesPlayerCanJoin(player);
  matchesInfo = matches.map(function(match) {
    return match.matchInfo();
  });
  var data = {
    action: ACTIVE_MATCHES_SET,
    matches: matchesInfo
  };
  player.emit(ACTIVE_MATCHES, data);
};

ConnectionHandler.prototype._subscribePlayerToActiveBots = function(player) {
  this._subscribers[ACTIVE_BOTS].push(player);
  var data = {
    action: ACTIVE_BOTS_SET,
    bots: this._bots.map(function(bot) {
      return bot.botInfo();
    })
  };
  player.emit(ACTIVE_BOTS, data);
};

ConnectionHandler.prototype._listenForEventsOnPlayer = function(player) {
  var self = this;

  // Let the player suscribe to updates about active matches.
  player.on(ACTIVE_MATCHES, function() {
    self._subscribePlayerToActiveMatches(player);
  });

  // Let the player suscribe to updates about active bots.
  player.on(ACTIVE_BOTS, function() {
    self._subscribePlayerToActiveBots(player); 
  });

  // Let the player join matches.
  player.on(JOIN_MATCH, function(data) {
    var match = gameManager.getMatchupById(data.matchId);
    if (match) {
      if (data.seat) {
        match.addPlayer(player, data.seat);
      } else {
        // If no seat is specified, the player is responding to an invite.
        var now = Date.now();
        for (var i  = 0; i < self._sentInvites.length; ++i) {
          var invite = self._sentInvites[i];
          // If the invite was over 15 seconds ago, dismiss it and go check the next invite.
          if (now - invite.timestamp > 15 * 1000) {
            self._sentInvites.splice(i, 1);
            --i;
            continue;
          }
          // If the invite is found, add the player to the appropriate game.
          if (invite.matchId == match.id && invite.playerId == player.identifier) {
            match.addPlayer(player, invite.seat);
            self._sentInvites.splice(i, 1);
            return;
          }
        }
        var errorMessage = "No seat specified and no invites found while tryin to join match '"
            + data.matchId + "'.";
        player.emit(ERROR_MESSAGE, {error: errorMessage});  
      }
    } else {
      player.emit(ERROR_MESSAGE, {error: "Unable to find match '" + data.matchId + "'."});
    }
  });

  // Let the player invite other players.
  player.on(INVITE_PLAYER, function(data) {
    if (data.playerId in self._players && self._players[data.playerId].length > 0) {
      data.timestamp = Date.now();
      self._sentInvites.push(data);
      var players = self._players[data.playerId];
      for (var i = 0; i < players.length; ++i) {
        var invitee = players[i];
        invitee.emit(INVITE_PLAYER, {matchId: data.matchId});
      }
    } else {
      player.emit(ERROR_MESSAGE, {error: "User '" + data.playerId + "' is currently not online."});
    }
  });

  // Handle disconnection
  player.on("disconnect", function() {
    self._removePlayer(player);
  });
}

ConnectionHandler.prototype.onClientConnect = function(socket) {
  this._addPlayer(new Player(socket));
};

ConnectionHandler.prototype.onBotConnect = function(socket) {
  this._addPlayer(new BotPlayer(socket));
};

ConnectionHandler.prototype._addPlayer = function(player) {
  var list = getOrCreateList(this._players, player.identifier);
  if (player instanceof BotPlayer) {
    // Only allow one instace to be connected at a time.
    for (var i = 0; i < list.length; ++i) {
      var bot  = list[i];
      var message =
          "Closing connection to allow " + bot.username + " to reconnect from another socket.";
      bot.emit(ERROR_MESSAGE, {error: message});
      bot.disconnect();
    }
    // We also have to notify people that a bot has connected.
    this._sendBotInfo(ACTIVE_BOTS_ADD, player);
    this._bots.push(player);
  }
  list.push(player);
  this._listenForEventsOnPlayer(player);
};

ConnectionHandler.prototype._removePlayer = function(player) {
  var list = getOrCreateList(this._players, player.identifier);
  removeItemFromList(player, list);
  // Remove the player from any subscription.
  for (var topic in this._subscribers) {
    removeItemFromList(player, this._subscribers[topic]);
  }
  if (player instanceof BotPlayer) {
    // We need to notify people that a bot has left.
    this._sendBotInfo(ACTIVE_BOTS_REMOVE, player);
    removeItemFromList(player, this._bots);
  }
};

// Returns the value of the specified dictionary at the specified key.
// If the key is not in the dictionary, create an empty list and put it in the dictionary
// before returning it.
function getOrCreateList(dictionary, key) {
  if (!(key in dictionary)) {
    dictionary[key] = [];
  }
  return dictionary[key];
}

// Removes the first occurence of the specified item from the specified list.
// Doesn't do anything if the specified item is not in the list.
function removeItemFromList(item, list) {
  var index = list.indexOf(item);
  if (index != -1) {
    list.splice(index, 1);
  }
}
