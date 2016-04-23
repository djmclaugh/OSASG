// The name of all the rooms a socket can suscribe to.
const ACTIVE_MATCHES = "api-active-matches";
const ACTIVE_BOTS = "api-active-bots";

const gameManager = require("./game_manager").prototype.getInstance();

function ConnectionHandler(clientServer, botServer) {
  var self = this;

  self.hasStarted = false;
  self.clientServer = clientServer;
  self.botServer = botServer;
  
  // Map of bots that are currently online. Key -> Value: username -> socket.
  self.bots = {};
  // Map of clients that are currently online. Key -> Value: username -> array of sockets.
  self.clients = {};
  // List of bot requests. This is used so that bots don't hijack matches or join in the wrong seat.
  self.sentBotRequests = [];
}

module.exports = ConnectionHandler;

ConnectionHandler.prototype.start = function() {
  var self = this;
  if (self.hasStarted) {
    return;
  }
  self.hasStarted = true;

  self.onMatchAddedCallbackId = gameManager.onMatchAdded(function(match) {
    self.sendMatchInfo("add", match);
  });
  self.onMatchRemovedCallbackId = gameManager.onMatchRemoved(function(match) {
    self.sendMatchInfo("remove", match);
  });
  self.onMatchUpdatedCallbackId = gameManager.onMatchUpdated(function(match) {
    self.sendMatchInfo("update", match);
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

// Sends a message to all clients with the given username that are suscribed to the message.
ConnectionHandler.prototype.sendToUser = function(username, message, data) {
  if (username in this.clients) {
    sockets = this.clients[username];
    for (var i = 0; i < sockets.length; ++i) {
      var socket = sockets[i];
      if (socket.locale.rooms.indexOf(message) != -1) {
        sockets[i].emit(message, data);
      }
    }
  }
};

// Sends a match related message to the appropriate clients.
// If the match is public send the message to all users suscribed to the active matches room.
// If the match is private only send the message to the users that can join the match.
ConnectionHandler.prototype.sendMatchInfo = function(action, match) {
  var data = {};
  data[action] = match;
  if (match.privateUsers == null) {
    this.clientServer.to(ACTIVE_MATCHES).emit(ACTIVE_MATCHES, data);
  } else {
    for (var i = 0; i < match.privateUsers.length; ++i) {
      this.sendToUser(match.privateUsers[i], ACTIVE_MATCHES, data);
    }
  }
};

ConnectionHandler.prototype.onClientConnect = function(socket) {
  var self = this;
  var username = socket.session.username;
  if (!(username in self.clients)) {
    self.clients[username] = [];
  }
  self.clients[username].push(socket);
  socket.emit("session-info", socket.session);

  socket.locale = {};
  socket.locale.rooms = [];

  // Let the client suscribe to updates about active matches.
  socket.on(ACTIVE_MATCHES, function() {
    socket.emit(ACTIVE_MATCHES, {set: gameManager.getMatchesUserCanJoin(username)});
    socket.locale.rooms.push(ACTIVE_MATCHES); 
    socket.join(ACTIVE_MATCHES);
  });

  // Let the client suscribe to updates about active bots.
  socket.on(ACTIVE_BOTS, function() {
    var botData = Object.keys(self.bots).map(function(value) {
      var session = self.bots[value].session;
      return {id: session.username, gameList: session.gameList};
    });
    socket.emit(ACTIVE_BOTS, {set: botData});
    socket.locale.rooms.push(ACTIVE_BOTS);
    socket.join(ACTIVE_BOTS); 
  });

  socket.on("join", function(data) {
    var match = gameManager.getMatchupById(data.matchId);
    if (match) {
      match.addPlayer(socket, data.seat);
    }
  });

  // Let the client request bots to join a match.
  socket.on("request-bot", function(data) {
    if (data.username in self.bots) {
      bot = self.bots[data.username];
      self.sentBotRequests.push({
          matchId: data.matchId,
          bot: bot,
          seat: data.seat,
          sent: Date.now()});
      bot.emit("join", {matchId: data.matchId});
    }
  });

  // Handle disconnection
  socket.on("disconnect", function() {
    var index = self.clients[username].indexOf(socket);
    self.clients[username].splice(index, 1);
  });
};

ConnectionHandler.prototype.onBotConnect = function(socket) {
  var self = this;
  var username = socket.session.username;
  
  if (username in self.bots) {
    self.bots[username].emit("error-message",
        {error: "Closing connection to allow " + username + " to reconnect from another socket."});
    self.bots[username].close();
  }
  
  self.bots[username] = socket;

  self.clientServer
      .to(ACTIVE_BOTS)
      .emit(ACTIVE_BOTS, {add: {id: username, gameList: socket.session.gameList}});

  // Invite to any game previously joined
  var matchesInProgress = gameManager.getMatchesUserIsPlaying(username);
  for (var i = 0; i < matchesInProgress.length; ++i) {
    socket.emit("join", {matchId: matchesInProgress[i].id});
  }
  
  // Allow the bot to join matches
  socket.on("join", function(data) {
    var matchup = gameManager.getMatchupById(data.matchId);
    if (!matchup) {
      return;
    }

    // Check if the bot is trying to reconnect
    if (matchup.p1Username == username) {
      matchup.addPlayer(socket, 1);
    }
    if (matchup.p2Username == username) {
      matchup.addPlayer(socket, 2);
    }

    // Check if the bot got invited to join the game
    self.cleanBotRequests();
    var validRequests = self.sentBotRequests.filter(function(item) {
      return item.matchId == data.matchId && item.bot == socket;
    });
    if (validRequests.length >= 1) {
      var request = validRequests[0];
      if (matchup) {
        try {
          matchup.addPlayer(socket, request.seat);
        } catch (e) {}
      }
      var requestIndex = self.sentBotRequests.indexOf(request);
      self.sentBotRequests.splice(requestIndex, 1);
    }
  });

  // Handle disconnection
  socket.on("disconnect", function() {
    if (username in self.bots && self.bots[username] == socket) {
      delete self.bots[username];
      self.clientServer
          .to(ACTIVE_BOTS)
          .emit(ACTIVE_BOTS, {remove: username});
    }
  });
};
