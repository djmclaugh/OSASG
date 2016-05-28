function Player(socket) {
  this.socket = socket;
  this.username = socket.session.username;
  this.identifier = socket.session.identifier;
}

module.exports = Player;

Player.prototype.disconnect = function() {
  this.emit("error-message", {error: "Server manually closing connection."});
  this.socket.close();  
};

Player.prototype.on = function(type, callback) {
  return this.socket.on(type, callback);  
};

Player.prototype.emit = function(type, message) {
  this.socket.emit(type, message);
};

Player.prototype.isSameUser = function(player) {
  return player != null && player.identifier == this.identifier;
};
