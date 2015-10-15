var net = require("net");

// SocketAdapter
// Adds the .on, .emit, and .session functionality to a TCP socket.
function SocketAdapter(socket) {
  this.socket = socket;
  this.callbacks = {};
  this.session = {};
  var self = this;
  
  var incompleteLine = "";
  var incompleteJSON = "";

  this.socket.on("data", function(data) {
    incompleteLine += data;
    var index = incompleteLine.indexOf("\n");
    while (index != -1) {
      onNewLine(incompleteLine.substring(0, index + 1));
      incompleteLine = incompleteLine.substring(index + 1);
      index = incompleteLine.indexOf("\n");
    }
    if (incompleteLine.length > 100000) {
      socket.destroy();
    }
  });
  
  function onNewLine(line) {
    incompleteJSON += line;
    var json;
    try {
      json = JSON.parse(incompleteJSON);
    } catch (e) {
      console.log(e);
      json = null;
    }
    if (json) {
      incompleteJSON = "";
      onMessage(json);
    }
    if (incompleteJSON.length > 100000) {
      socket.destroy();
    }
  }

  function onMessage(message) {
    var type = message.type;
    delete message.type;
    if (type in self.callbacks) {
      for (var i = 0; i < self.callbacks[type].length; ++i) {
        self.callbacks[type][i](message);
      }
    }
  }

  this.socket.on("error", function(error) {
    console.log("An error has occured on " + self.session.username + ": " + error);
    socket.destroy();
    onMessage({type: "disconnect"});
  });

  this.socket.on("end", function() {
    socket.destroy();
    onMessage({type: "disconnect"});
  });
}

SocketAdapter.prototype.on = function(type, callback) {
  if (!(type in this.callbacks)) {
    this.callbacks[type] = [];
  }
  this.callbacks[type].push(function(message) {
    process.nextTick(function() {
      callback(message);
    });
  });
};

SocketAdapter.prototype.emit = function(type, message) {
  message.type = type;
  this.socket.write(JSON.stringify(message) + "\n");
  delete message.type;
};

SocketAdapter.prototype.close = function() {
  this.socket.destroy();
};

////////////////////////////////////////

function SocketServer(port) {
  this.callbacks = [];
  this.sockets = [];
  
  var self = this;
  
  this.server = net.createServer(function(socket) {
    var adapter = new SocketAdapter(socket);
    self.sockets.push(adapter);
    adapter.on("authorization", function(data) {
      adapter.session.username = data.name;
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