// This is a javascript for node.js implementation of a bot that looks at all moves of a specified
// depth.
// This bot is able to play any game on OSASG.
// Feel free to use this as a framework to make your own bot.

var Bot = require("./bot");
var Games = require("../matches/games");

const GAMES_I_CAN_PLAY_STRINGS = ["Tictactoe", "Connect6"]
const GAMES_I_CAN_PLAY = [Games.Tictactoe, Games.Connect6];

function BruteBot(name, password, depth) {
  Bot.call(this, name, password, GAMES_I_CAN_PLAY_STRINGS);
  this.depth = depth;
}

module.exports = BruteBot;

BruteBot.prototype = Object.create(Bot.prototype);
BruteBot.prototype.constructor = BruteBot;

BruteBot.prototype.wantToJoin = function(matchId, settings) {
  if (Object.keys(this.matches).length >= 100) {
    return false;
  }
  var gameClass = Games.gameClassFromId(matchId);
  return GAMES_I_CAN_PLAY.indexOf(gameClass) != -1;
};

BruteBot.prototype.getMove = function(match) {
  var game = match.game;
  var desiredOutcome;
  var undesiredOutcome;
  if (game.whosTurnIsIt() == game.PLAYER_ENUM.P1) {
    desiredOutcome = game.STATUS_ENUM.P1_WIN;
    undesiredOutcome = game.STATUS_ENUM.P2_WIN;
  } else {
    desiredOutcome = game.STATUS_ENUM.P2_WIN;
    undesiredOutcome = game.STATUS_ENUM.P1_WIN;
  }
  var moves = this.getMoveRecursion(game.copy(), desiredOutcome, undesiredOutcome, 2);
  var candidates = moves.good;
  if (candidates.length == 0) {
    candidates = moves.draw;
  }
  if (candidates.length == 0) {
    candidates = moves.unknown;
  }
  if (candidates.length == 0) {
    candidates = moves.bad;
  }
  if (candidates.length == 0) {
    throw new Error("This should never happen!!!");
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

BruteBot.prototype.getMoveRecursion = function(game, desiredOutcome, undesiredOutcome, depth) {
  var legalMoves = game.getLegalMoves();
  var goodMoves = [];
  var drawMoves = [];
  var unknownMoves = [];
  var badMoves = [];
  for (var i = 0; i < legalMoves.length; ++i) {
    var move = legalMoves[i];
    console.log("depth: " + depth);
    console.log(move);
    game.makeMove(move);
    var outcome = game.getStatus();
    if (outcome == desiredOutcome) {
      goodMoves.push(move);
    } else if (outcome == game.STATUS_ENUM.UNDECIDED) {
      if (depth < this.depth) {
        var movesFromHere =
          this.getMoveRecursion(game, undesiredOutcome, desiredOutcome, depth + 1);
        if (movesFromHere.good.length > 0) {
          badMoves.push(move);
        } else if (movesFromHere.unknown.length > 0) {
          unknownMoves.push(move);
        } else if (movesFromHere.draw.length > 0) {
          drawMoves.push(move);
        } else if (movesFromHere.bad.length > 0) {
          goodMoves.push(move);
        } else {
          throw new Error("This should never happen!!!");
        }
      } else {
        unknownMoves.push(move);
      }
    } else if (outcome == game.STATUS_ENUM.DRAW) {
      drawMoves.push(move);
    } else {
      badMoves.push(move);
    }
    game.undoLastMove();
  }
  return {
      good: goodMoves,
      unknown: unknownMoves,
      draw: drawMoves,
      bad: badMoves
  };
};
