var Player = require("../../../modules/matches/player");
var EventDispatcher = require("../../../modules/event_dispatcher");

// Mocks a player object with the specified username and identifier.
// 'emitCallback' will be called whenever we try to send a message to the player.
function MockPlayer(username, identifier, emitCallback) {
  this.username = username;
  this.identifier = identifier;
  this.emitCallback = emitCallback;
  this.dispatcher = new EventDispatcher();
  this.hasDisconnected = false;
}

MockPlayer.prototype = Object.create(Player.prototype);
MockPlayer.prototype.constructor = MockPlayer;

module.exports = MockPlayer;

// Overide methods involving sockets.
MockPlayer.prototype.disconnect = function() {
  this.emit("error-message", {error: "Server manually closing connection."});
  this.emit("disconnect", {});
  this.hasDisconnected = true;
};

MockPlayer.prototype.on = function(type, callback) {
  return this.dispatcher.on(type, callback);
};

MockPlayer.prototype.emit = function(type, message) {
  if (this.emitCallback && !this.hasDisconnected) {
    var self = this;
    process.nextTick(function() {
      self.emitCallback(type, message);
    });
  }
};

// Add a method to mimic message sent by socket.
MockPlayer.prototype.mockSocketSent = function(type, message) {
  if (!this.hasDisconnected) {
    var self = this;
    process.nextTick(function() {
      self.dispatcher.dispatchEvent(type, message);
    });
  }
};
