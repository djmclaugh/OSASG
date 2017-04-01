var Player = require("./matches/player");

function BotPlayer(socket) {
  Player.call(this, socket, socket.session.username, socket.session.identifier);
  this.gameList = socket.session.gameList.slice();
}

BotPlayer.prototype = Object.create(Player.prototype);
BotPlayer.prototype.constructor = BotPlayer;

BotPlayer.prototype.botInfo = function() {
  return {
    gameList: this.gameList,
    username: this.username,
    identifier: this.identifier
  }
}

module.exports = BotPlayer;
