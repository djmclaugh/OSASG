// Adds the .on, .emit, and .session functionality to a TCP socket using new line delemited JSON.
function SocketAdapter(socket, bufferSize) {
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
    if (incompleteLine.length + incompleteJSON.legnth > bufferSize) {
      socket.destroy();
    }
  });

  function onNewLine(line) {
    incompleteJSON += line;
    var json;
    try {
      json = JSON.parse(incompleteJSON);
    } catch (e) {
      json = null;
    }
    if (json) {
      incompleteJSON = "";
      onMessage(json);
    }
  }

  function onMessage(message) {
    var type = message.type;
    delete message.type;
    if (type in self.callbacks) {
      var callbacks = self.callbacks[type];
      for (var i = 0; i < callbacks.length; ++i) {
        callbacks[i](message);
      }
    }
  }

  this.socket.on("error", function(error) {
    socket.destroy();
    onMessage({type: "error", error: error});
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
};

SocketAdapter.prototype.close = function() {
  this.socket.destroy();
};

module.exports = SocketAdapter;
