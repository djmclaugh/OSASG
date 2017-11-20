var EventDispatcher = require("../event_dispatcher");

function Player(socket, username, identifier) {
  var self = this;
  this.socket = socket;
  this.username = username;
  this.identifier = identifier ? identifier : username;
  this.dispatcher = new EventDispatcher();
  this.socket.on("message", function(msg) {
    var message = JSON.parse(msg);
    var type = message.type;
    delete message.type;
    self.dispatcher.dispatchEvent(type, message);
  });
  this.socket.on("close", function() {
    self.dispatcher.dispatchEvent("disconnect", {});
  });
}

module.exports = Player;

Player.prototype.disconnect = function() {
  this.emit("error-message", {error: "Server manually closing connection."});
  this.socket.close();  
};

Player.prototype.on = function(type, callback) {
  this.socket.on(type, callback);
  return this.dispatcher.on(type, callback);
};

Player.prototype.emit = function(type, message) {
  message.type = type;
  if (this.socket.send) {
    this.socket.send(JSON.stringify(message));
  } else if (this.socket.emit) {
    this.socket.emit(type, message);
  } else {
    console.log("something went wrong");
  }
};

Player.prototype.isSameUser = function(player) {
  return player != null && player.identifier == this.identifier;
};
