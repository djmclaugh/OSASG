var EventDispatcher = require("./event_dispatcher");

// Adds the .on, .emit, and .session functionality to a TCP socket using new line delemited JSON.
function SocketAdapter(socket, bufferSize) {
  if (!bufferSize) {
    bufferSize = 100000;
  }
  this.isLogging = false;
  this.socket = socket;
  this.dispatcher = new EventDispatcher();
  this.session = {};
  var self = this;

  var incompleteLine = "";
  var incompleteJSON = "";

  this.socket.on("data", function(data) {
    if (typeof data != "string") {
      data = data.toString('utf-8');
    }
    incompleteLine += data;
    var index = incompleteLine.indexOf("\n");
    while (index != -1) {
      onNewLine(incompleteLine.substring(0, index + 1));
      incompleteLine = incompleteLine.substring(index + 1);
      index = incompleteLine.indexOf("\n");
    }
    if (incompleteLine.length + incompleteJSON.legnth > bufferSize) {
      console.log("Error: Trying to parse message larger than allocated buffer size.");
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
    if (self.isLogging) {
      console.log("Received " + type);
      console.log(JSON.stringify(message));
    }
    self.dispatcher.dispatchEvent(type, message);
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
  return this.dispatcher.on(type, callback);  
};

SocketAdapter.prototype.emit = function(type, message) {
  if (this.isLogging) {
    console.log("Sending " + type);
    console.log(JSON.stringify(message));
  }
  message.type = type;
  this.socket.write(JSON.stringify(message) + "\n");
};

SocketAdapter.prototype.close = function() {
  this.socket.destroy();
};

module.exports = SocketAdapter;
