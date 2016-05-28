var Player = require("./matches/player");

function BotPlayer(socket) {  
  Player.call(this, socket);
  this.gameList = socket.session.gameList.slice();
}

BotPlayer.prototype = Object.create(Player.prototype);
BotPlayer.prototype.constructor = BotPlayer;

BotPlayer.prototype.botInfo = function() {
  return {
    gameList: this.gameList,
    username: this.username
  }
}

module.exports = BotPlayer;