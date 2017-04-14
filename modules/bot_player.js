var Player = require("./matches/player");

function BotPlayer(socket) {
  Player.call(this, socket, socket.session.username, socket.session.identifier);
}

BotPlayer.prototype = Object.create(Player.prototype);
BotPlayer.prototype.constructor = BotPlayer;

BotPlayer.prototype.botInfo = function() {
  return {
    username: this.username,
    identifier: this.identifier
  }
}

module.exports = BotPlayer;
