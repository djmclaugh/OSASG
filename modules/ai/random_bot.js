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
  if (game instanceof Games.Tictactoe) {
    return this.getTictactoeMove(game);
  } else if (game instanceof Games.Connect6) {
    return this.getConnect6Move(game);
  }
  return null;
};

RandomBot.prototype.getTictactoeMove = function(game) {
  var possibleMoves = [];
  for (var i = 0; i < 9; ++i) {
    if (game.getColourAt(i) == game.COLOUR_ENUM.EMPTY) {
      possibleMoves.push(i);
    }
  }
  if (possibleMoves.length == 0) {
    return null;
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};

RandomBot.prototype.getConnect6Move = function(game) {
  var openSpots = [];
  for (var i = 0; i < 19; ++i) {
    for (var j = 0; j < 19; ++j) {
      if (game.board[i][j] == 3) {
        openSpots.push({x: i, y: j});
      }
    }
  }
  if (openSpots.length == 0) {
    return null;
  }
  var rand1 = Math.floor(Math.random() * openSpots.length);
  var rand2 = Math.floor(Math.random() * (openSpots.length - 1));
  if (rand2 >= rand1) {
    rand2 += 1;
  }
  var p1 = openSpots[rand1];
  var p2 = openSpots[rand2];
  if (game.moves.length == 0) {
    return {p1: p1};
  } else {
    return {p1: p1, p2: p2};
  }
};
