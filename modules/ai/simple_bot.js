// This is a javascript for node.js implementation of a bot that notices immediate winning and
// lossing moves.
// This bot is able to play any game on OSASG.
// Feel free to use this as a framework to make your own bot.

var Bot = require("./bot");
var Games = require("../games");

const GAMES_I_CAN_PLAY = [Games.Tictactoe, Games.Connect6];

function SimpleBot() {
  Bot.call(this, "OSASG-SimpleBot", "not yet implemented", ["Tictactoe", "Connect6"]);
}

module.exports = SimpleBot;

SimpleBot.prototype = Object.create(Bot.prototype);
SimpleBot.prototype.constructor = SimpleBot;

SimpleBot.prototype.wantToJoin = function(matchId, settings) {
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

SimpleBot.prototype.getMove = function(match) {
  var game = match.game;
  if (game instanceof Games.Tictactoe) {
    return this.getTictactoeMove(game);
  } else if (game instanceof Games.Connect6) {
    return this.getConnect6Move(game);
  }
  return null;
};

SimpleBot.prototype.getTictactoeMove = function(game) {
  var possibleMoves = game.getLegalMoves();
  if (possibleMoves.length == 0) {
    return null;
  }

  var myColour = game.moves.length % 2 ? game.COLOUR_ENUM.X : game.COLOUR_ENUM.O;
  var otherColour = game.moves.length % 2 ? game.COLOUR_ENUM.O : game.COLOUR_ENUM.X;

  var winningMoves = []; 
  for (var i = 0; i < possibleMoves.length; ++i) {
    var move = possibleMoves[i];
    game.board.setStateAtPosition(move, myColour);
    if (game.getWinLine()) {
      winningMoves.push(move);
    }
    game.board.setStateAtPosition(move, game.COLOUR_ENUM.EMPTY);
  }
  if (winningMoves.length) {
    return winningMoves[Math.floor(Math.random() * winningMoves.length)];
  }

  var blockingMoves = [];
  for (var i = 0; i < possibleMoves.length; ++i) {
    var move = possibleMoves[i];
    game.board.setStateAtPosition(move, otherColour);
    if (game.getWinLine()) {
      blockingMoves.push(move);
    }
    game.board.setStateAtPosition(move, game.COLOUR_ENUM.EMPTY);
  }
  if (blockingMoves.length) {
    return blockingMoves[Math.floor(Math.random() * blockingMoves.length)];
  }

  // Otherwise, just play randomly
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};

function areWithin6InARow(p1, p2) {
  var y1 = p1 / 19;
  var y2 = p2 / 19;
  if (y1 - y2 > 5 || y2 - y1 > 5) {
    return false;
  }
  var x1 = p1 % 19;
  var x2 = p2 % 19;
  if (x1 - x2 > 5 || x2 - x1 > 5) {
    return false;
  }
  return true;
}

function intersection(move1, move2) {
  if (move1[0] == move2[0] || move1[0] == move2[1]) {
    return move1[0];
  }
  if (move1[1] == move2[0] || move1[1] == move2[1]) {
    return move1[1];
  }
  return -1;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

SimpleBot.prototype.getConnect6Move = function(game) {
  if (game.moves.length == 0) {
    return [Math.floor(Math.random() * 19 * 19)];
  }
  
  var EMPTY = game.COLOUR_ENUM.EMPTY;
  var BLACK = game.COLOUR_ENUM.BLACK;
  var WHITE = game.COLOUR_ENUM.WHITE;

  var openSpots = game.board.getPositionsWithState(EMPTY);

  var myColour = game.getColourToPlay();
  var opponentColour = myColour == BLACK ? WHITE : BLACK;

  // If I can win, win.
  for (var i = 0; i < openSpots.length; ++i) {
    p1 = openSpots[i];
    if (game.willMoveWin([p1], myColour)) {
      return [p1, openSpots[(i + 1) % openSpots.length]];
    }
    for (var j = i - 1; j >= 0; --j) {
      p2 = openSpots[j];
      if (areWithin6InARow(p1, p2) && game.willMoveWin([p1, p2], myColour)) {
        return [openSpots[i], openSpots[j]];
      }
    }
  }

  // Find all the ways my opponent can win.
  var singleWins = [];
  var doubleWins = [];
  for (var i = 0; i < openSpots.length; ++i) {
    p1 = openSpots[i];
    if (game.willMoveWin([p1], opponentColour)) {
      singleWins.push(p1);
      continue;
    }
    for (var j = i - 1; j >= 0; --j) {
      p2 = openSpots[j];
      if (singleWins.indexOf(p2) == -1
          && areWithin6InARow(p1, p2)
          && game.willMoveWin([p1, p2], opponentColour)) {
        doubleWins.push([p1, p2]);
      }
    }
  }

  if (singleWins.length >= 2) {
    var rand1 = Math.floor(Math.random() * singleWins.length);
    var rand2 = Math.floor(Math.random() * (singleWins.length - 1));
    if (rand2 >= rand1) {
      rand2 += 1;
    }
    return [singleWins[rand1], singleWins[rand2]];
  }

  if (singleWins.length == 1) {
    var blocker = singleWins[0];
    if (doubleWins.length == 1) {
      return [blocker, pickOne(doubleWins[0])];
    }
    if (doubleWins.length >= 2) {
      var otherBlocker = intersection(doubleWins[0], doubleWins[1]);
      if (otherBlocker == -1) {
        var otherMove = pickOne(doubleWins);
        otherBlocker = pickOne(otherMove);
      }
      return [blocker, otherBlocker];
    }
    var blockerIndex = openSpots.indexOf(blocker);
    var rand = Math.floor(Math.random() * (openSpots.length - 1));
    if (rand >= blockerIndex) {
      rand += 1;
    }
    return [blocker, openSpots[rand]];
  }
  if (doubleWins.length == 1) {
    blocker = pickOne(doubleWins[0]);
    var blockerIndex = openSpots.indexOf(blocker);
    var rand = Math.floor(Math.random() * (openSpots.length - 1));
    if (rand >= blockerIndex) {
      rand += 1;
    }
    return [blocker, openSpots[rand]];
  }
  if (doubleWins.length == 2) {
    blocker = intersection(doubleWins[0], doubleWins[1]);
    if (blocker == -1) {
      return [pickOne(doubleWins[0]), pickOne(doubleWins[1])];
    }
    var blockerIndex = openSpots.indexOf(blocker);
    var rand = Math.floor(Math.random() * (openSpots.length - 1));
    if (rand >= blockerIndex) {
      rand += 1;
    }
    return [blocker, openSpots[rand]];
  }
  if (doubleWins.length >= 3) {
    blocker = intersection(doubleWins[0], doubleWins[1]);
    if (blocker == -1) {
      blocker = intersection(doubleWins[0], doubleWins[2]);
    }
    if (blocker == -1) {
      blocker = intersection(doubleWins[1], doubleWins[2]);
    }
    if (blocker == -1) {
      return [pickOne(doubleWins[0]), pickOne(doubleWins[1])];
    }
    var doesNotContainBlocker = doubleWins.filter(function(move) {
      return move[0] != blocker && move[1] != blocker;
    });
    if (doesNotContainBlocker.length == 0) {
      var blockerIndex = openSpots.indexOf(blocker);
      var rand = Math.floor(Math.random() * (openSpots.length - 1));
      if (rand >= blockerIndex) {
        rand += 1;
      }
      return [blocker, openSpots[rand]];
    }
    if (doesNotContainBlocker.length == 1) {
      return [blocker, pickOne(doesNotContainBlocker[0])];
    }
    var secondBlocker = intersection(doesNotContainBlocker[0], doesNotContainBlocker[1]);
    if (secondBlocker == -1) {
      return [blocker, pickOne(doesNotContainBlocker[0])];
    }
    return [blocker, secondBlocker];
  }
  
  // Otherwise, just play randomly
  var rand1 = Math.floor(Math.random() * openSpots.length);
  var rand2 = Math.floor(Math.random() * (openSpots.length - 1));
  if (rand2 >= rand1) {
    rand2 += 1;
  }
  return [openSpots[rand1], openSpots[rand2]];
};

