var net = require("net");
var SocketAdapter = require("./socket_adapter");
var EventDispatcher = require("./event_dispatcher");
var db = require("./db");

function SocketServer(port) {
  this.dispatcher = new EventDispatcher();
  this.sockets = [];
  
  var self = this;
  
  this.server = net.createServer(function(socket) {
    var adapter = new SocketAdapter(socket);
    self.sockets.push(adapter);
    adapter.on("authorization", function(data) {
      db.Bot.findById(data.identifier, function(error, bot) {
        if (error) {
          adapter.emit("error-message", {error: error.message});
          adapter.close();
        } else if (!bot) {
          adapter.emit("error-message", {error: "Identifier not recognized."});
          adapter.close();
        } else if (!data.password || bot.password != data.password) {
          adapter.emit("error-message", {error: "Wrong password."});
          adapter.close();
        } else {
          adapter.session.username = bot.username;
          adapter.session.identifier = bot.id;
          adapter.session.gameList = data.gameList;
          self.dispatcher.dispatchEvent("connection", adapter);
        }
      });
    });
    adapter.on("disconnect", function() {
      var index = self.sockets.indexOf(adapter);
      self.sockets.splice(index, 1);
    });
  }).listen(port);
}

SocketServer.prototype.onConnection = function(callback) {
  return this.dispatcher.on("connection", callback);
};

SocketServer.prototype.removeListener = function(id) {
  this.dispatcher.removeListener(id);
};

SocketServer.prototype.close = function(callback) {
  this.server.close(callback);
  for (var i = 0; i < this.sockets.length; ++i) {
    this.sockets[i].close();
  }
};

module.exports = SocketServer;
