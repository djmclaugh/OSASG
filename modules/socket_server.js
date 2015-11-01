var net = require("net");
var SocketAdapter = require("./socket_adapter");

function SocketServer(port) {
  this.callbacks = [];
  this.sockets = [];
  
  var self = this;
  
  this.server = net.createServer(function(socket) {
    var adapter = new SocketAdapter(socket);
    self.sockets.push(adapter);
    adapter.on("authorization", function(data) {
      adapter.session.username = data.name;
      adapter.session.gameList = data.gameList;
      for (var i = 0; i < self.callbacks.length; ++i) {
        self.callbacks[i](adapter);
      }
    });
    adapter.on("disconnect", function() {
      var index = self.sockets.indexOf(adapter);
      self.sockets.splice(index, 1);
    });
  }).listen(port);
}

SocketServer.prototype.onConnection = function(callback) {
  this.callbacks.push(function(socket) {
    process.nextTick(function() {
      callback(socket);
    });
  });
};

SocketServer.prototype.close = function(callback) {
  this.server.close(callback);
  for (var i = 0; i < this.sockets.length; ++i) {
    this.sockets[i].close();
  }
};

module.exports = SocketServer;
