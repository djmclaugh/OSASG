// This is a javascript for node.js implementation of a bot that makes random moves.
// This bot is able to play any game on OSASG.
// Feel free to use this as a framework to make your own bot.

var Bot = require("./bot");
var Games = require("../games");

const GAMES_I_CAN_PLAY = [Games.Tictactoe, Games.Connect6];

function RandomBot() {
  Bot.call(this, "OSASG-RandomBot", "not yet implemented", ["Tictactoe", "Connect6"]);
}

module.exports = RandomBot;

RandomBot.prototype = Object.create(Bot.prototype);
RandomBot.prototype.constructor = RandomBot;

RandomBot.prototype.wantToJoin = function(matchId, settings) {
  if (Object.keys(this.matches).length >= 100) {
    return false;
  }
  var gameClass = Games.gameClassFromId(matchId);
  for (var i = 0; i < GAMES_I_CAN_PLAY.length; ++i) {
    if (gameClass == GAMES_I_CAN_PLAY[i]) {
      return true;
    }
  }
  return false;
};

RandomBot.prototype.getMove = function(match) {
  var game = match.game;
  var possibleMoves = game.getLegalMoves();
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};
