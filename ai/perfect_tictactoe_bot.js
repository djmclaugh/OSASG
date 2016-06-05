var Bot = require("./bot");
var Games = require("../modules/matches/games");
var credentials = require("./bot_config.json").perfect_tictactoe;

// Since tictactoe is such a small game, we can just compute the game tree.

// Given a board position, the game tree will tell you what is your best outcome and which moves
// to play in order to achieve it.
const GAME_TREE = {};

var g = Games.newGame("Tictactoe");

const X = g.COLOUR_ENUM.X;
const O = g.COLOUR_ENUM.O;
const EMPTY = g.COLOUR_ENUM.EMPTY;

function gameToHash(game) {
  var hash = 0;
  for (var i = 0; i < 9; ++i) {
    var power = Math.pow(3, i);
    if (game.getColourAt(i) == X) {
      hash += power;
    } else if (game.getColourAt(i) == O) {
      hash += (2 * power);
    }
  }
  return ""+hash;
}

function getValueForCurrentPosition() {
  var hash = gameToHash(g);
  
  if (hash in GAME_TREE) {
    return GAME_TREE[hash];
  }
  
  var gameStatus = g.getStatus();
  if (gameStatus != g.STATUS_ENUM.UNDECIDED) {
    var value = {};
    if (gameStatus == g.STATUS_ENUM.DRAW) {
      value.best = 0;
      value.worst = 0;
    } else {
      value.best = -1;
      value.worst = -1;
    }
    GAME_TREE[hash] = value;
    return value;
  }

  var moves = [
    [[]],
    [[], []],
    [[], [], []]
  ];

  for (var i = 0; i < 9; ++i) {
    if (g.getColourAt(i) == EMPTY) {
      g.makeMove(i);
      var value = getValueForCurrentPosition();
      var best = -value.worst;
      var worst = -value.best;
      moves[best + 1][worst + 1].push(i);
      g.undoLastMove();
    }
  }

  var value = {};
  for (var worst = 2; worst >= 0; --worst) {
    for(var best = 2; best >= worst; --best) {
      if (moves[best][worst].length) {
        value.best = best - 1;
        value.worst = worst - 1;
        value.moves = moves[best][worst];
        GAME_TREE[hash] = value;
        return value;
      }
    }
  }
}

getValueForCurrentPosition();

function PerfectTictactoeBot() {
  Bot.call(this, credentials.identifier, credentials.password, ["Tictactoe"]);
}

module.exports = PerfectTictactoeBot;

PerfectTictactoeBot.prototype = Object.create(Bot.prototype);
PerfectTictactoeBot.prototype.constructor = PerfectTictactoeBot;

PerfectTictactoeBot.prototype.wantToJoin = function(matchId, settings) {
  if (Object.keys(this.matches).length >= 100) {
    return false;
  }
  var gameClass = Games.gameClassFromId(matchId);
  return gameClass == Games.Tictactoe;
};

PerfectTictactoeBot.prototype.getMove = function(match) {
  var moves = GAME_TREE[gameToHash(match.game)].moves;
  return moves[Math.floor(Math.random() * moves.length)];
};

