// This is a javascript for node.js implementation of a bot that makes and blocks winning moves.
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
  var possibleMoves = [];
  for (var i = 0; i < 9; ++i) {
    if (game.getColourAt(i) == game.COLOUR_ENUM.EMPTY) {
      possibleMoves.push(i);
    }
  }
  if (possibleMoves.length == 0) {
    return null;
  }
  var myBoard;
  var otherBoard;
  if (game.whosTurnIsIt() == game.PLAYER_ENUM.P1) {
    myBoard = game.boardX;
    otherBoard = game.boardO;
  } else {
    myBoard = game.boardO;
    otherBoard = game.boardX;
  }


  var winningMoves = []; 
  for (var i = 0; i < possibleMoves.length; ++i) {
    for (var j = 0; j < game.LINES.length; ++j) {
      var mask = Math.pow(2, possibleMoves[i]);
      var line = game.LINES[j];
      if (((myBoard | mask) & line) == line) {
        winningMoves.push(possibleMoves[i]);
        break;
      }
    }
  }
  if (winningMoves.length) {
    return winningMoves[Math.floor(Math.random() * winningMoves.length)];
  }

  var blockingMoves = [];
  for (var i = 0; i < possibleMoves.length; ++i) {
    for (var j = 0; j < game.LINES.length; ++j) {
      var mask = Math.pow(2, possibleMoves[i]);
      var line = game.LINES[j];
      if (((otherBoard | mask) & line) == line) {
        blockingMoves.push(possibleMoves[i]);
        break;
      }
    }
  }
  if (blockingMoves.length) {
    return blockingMoves[Math.floor(Math.random() * blockingMoves.length)];
  }


  // Otherwise, just play randomly
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};

SimpleBot.prototype.getConnect6Move = function(game) {
  // Just play in the center if this is the first move.
  if (game.moves.length == 0) {
    return {p1: {x: 9, y: 9}};
  }
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
  
  var myColour = 1 + (game.moves.length % 2);
  var opponentColour = 3 - myColour;

  function isWinningMove(move1, move2, colour) {
    var counter; 
    
    // Horizontal Checks
    counter = 0;
    for (var i = Math.max(move1.x - 5, 0); i < Math.min(move1.x + 5, 18); ++i) {
      if (game.board[i][move1.y] == colour || i == move1.x || (i == move2.x && move1.y == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    counter = 0;
    for (var i = Math.max(move2.x - 5, 0); i < Math.min(move2.x + 5, 18); ++i) {
      if (game.board[i][move2.y] == colour || i == move2.x || (i == move1.x && move1.y == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    
    // Vertical Checks
    counter = 0;
    for (var i = Math.max(move1.y - 5, 0); i < Math.min(move1.y + 5, 18); ++i) {
      if (game.board[move1.x][i] == colour || i == move1.y || (i == move2.y && move1.x == move2.x)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    counter = 0;
    for (var i = Math.max(move2.y - 5, 0); i < Math.min(move2.y + 5, 18); ++i) {
      if (game.board[move2.x][i] == colour || i == move2.y || (i == move1.y && move1.x == move2.x)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    
    // x=y checks
    counter = 0;
    for (var i = -5; i < 5; ++i) {
      var testX = move1.x + i;
      var testY = move1.y + i;
      if (testX < 0 || testX > 18 || testY < 0 || testY > 18) {
        continue;
      }
      if (game.board[testX][testY] == colour || (testX == move1.x && testY == move1.y) || (testX == move2.x && testY == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    counter = 0;
    for (var i = -5; i < 5; ++i) {
      var testX = move2.x + i;
      var testY = move2.y + i;
      if (testX < 0 || testX > 18 || testY < 0 || testY > 18) {
        continue;
      }
      if (game.board[testX][testY] == colour || (testX == move1.x && testY == move1.y) || (testX == move2.x && testY == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    
    // x=-y checks
    counter = 0;
    for (var i = -5; i < 5; ++i) {
      var testX = move1.x + i;
      var testY = move1.y - i;
      if (testX < 0 || testX > 18 || testY < 0 || testY > 18) {
        continue;
      }
      if (game.board[testX][testY] == colour || (testX == move1.x && testY == move1.y) || (testX == move2.x && testY == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    counter = 0;
    for (var i = -5; i < 5; ++i) {
      var testX = move2.x + i;
      var testY = move2.y - i;
      if (testX < 0 || testX > 18 || testY < 0 || testY > 18) {
        continue;
      }
      if (game.board[testX][testY] == colour || (testX == move1.x && testY == move1.y) || (testX == move2.x && testY == move2.y)) {
        counter += 1;
        if (counter == 6) {
          return true;
        }
      } else {
        counter = 0;
      }
    }
    
    return false;
  }

  //TODO(djmclaugh): Improve algorithm for finding winning moves.  
  // If I can win, win.
  for (var i = 0; i < openSpots.length; ++i) {
    for (var j = i; j < openSpots.length; ++j) {
      if (isWinningMove(openSpots[i], openSpots[j], myColour)) {
        return {p1: openSpots[i], p2:openSpots[j]};
      }
    }
  }
  
  // Find all the ways my opponent can win.
  var opponentWinningMoves = [];
  for (var i = 0; i < openSpots.length; ++i) {
    for (var j = i; j < openSpots.length; ++j) {
      if (isWinningMove(openSpots[i], openSpots[j], opponentColour)) {
        opponentWinningMoves.push({p1: openSpots[i], p2:openSpots[j]});
      }
    }
  }
  
  // We assume no move is exactly the same, so at most one element is in the intersection.
  // Since the positions are actually the same objects, we can use == instead of checking their x and y property.
  function intersection(move1, move2) {
    if (move1.p1 == move2.p1 || move1.p1 == move2.p2) {
      return move1.p1;
    }
    if (move1.p2 == move2.p1 || move1.p2 == move2.p2) {
      return move1.p2;
    }
    return null;
  }
  
  if (opponentWinningMoves.length == 1) {
    // If there is only one winning move, have one stone intersect that move and the other can be random.
    var blocker = Math.random() < 0.5 ? opponentWinningMoves[0].p1 : opponentWinningMoves[0].p2;
    var blockerIndex = openSpots.indexOf(blocker);
    var rand = Math.floor(Math.random() * (openSpots.length - 1));
    if (rand >= blockerIndex) {
      rand += 1;
    }
    return {p1: blocker, p2: openSpots[rand]};
  } else if (opponentWinningMoves.length == 2) {
    // If there is intersection, use that blocker and a random move, otherwise, we have exactly 4 choices.
    var win1 = opponentWinningMoves[0];
    var win2 = opponentWinningMoves[1];
    var blocker = intersection(win1, win2);
    if (blocker) {
      var blockerIndex = openSpots.indexOf(blocker);
      var rand = Math.floor(Math.random() * (openSpots.length - 1));
      if (rand >= blockerIndex) {
        rand += 1;
      }
      return {p1: blocker, p2: openSpots[rand]};
    } else {
      var p1 = Math.random() < 0.5 ? win1.p1 : win1.p2;
      var p2 = Math.random() < 0.5 ? win2.p1 : win2.p2;
      return {p1: p1, p2: p2};
    }
  } else if (opponentWinningMoves.length >= 3) {
    // There has to be an intersection in the first three moves or we can't find a solution.
    var blocker = intersection(opponentWinningMoves[0], opponentWinningMoves[1]) ||
        intersection(opponentWinningMoves[0], opponentWinningMoves[2]) ||
        intersection(opponentWinningMoves[1], opponentWinningMoves[2]);
    if (!blocker) {
      // If ther is no solution, block the first two moves.
      var p1 = Math.random() < 0.5 ? opponentWinningMoves[0].p1 : opponentWinningMoves[0].p2;
      var p2 = Math.random() < 0.5 ? opponentWinningMoves[1].p1 : opponentWinningMoves[1].p2;
      return {p1: p1, p2: p2};
    }
    // Get all the remaining moves that are not blocked by the blocker.
    var doesNotContainBlocker = opponentWinningMoves.filter(function(move) {
      return move.p1 != blocker && move.p2 != blocker;
    });
    if (doesNotContainBlocker.length == 0) {
      // If all moves are blocked, then our second stone can be random.
      var blockerIndex = openSpots.indexOf(blocker);
      var rand = Math.floor(Math.random() * (openSpots.length - 1));
      if (rand >= blockerIndex) {
        rand += 1;
      }
      return {p1: blocker, p2: openSpots[rand]};
    } else if (doesNotContainBlocker.length == 1) {
      // If only one move is not blocked, block it.
      return {p1: blocker, p2: Math.random() < 0.5 ? doesNotContainBlocker[0].p1 : doesNotContainBlocker[0].p2};
    } else {
      // If two or move moves remain unblock, our only chance of blocking them all is if they all have a common intersection.
      // So if we can block them, the first two unblocked move will have the intersection we have to play.
      // Otherwise, we only block the first two (or only the first, if they don't even have an intersection).
      var secondBlocker = intersection(doesNotContainBlocker[0], doesNotContainBlocker[1]);
      if (!secondBlocker) {
        return {p1: blocker, p2: Math.random() < 0.5 ? doesNotContainBlocker[0].p1 : doesNotContainBlocker[0].p2};
      } else {
        return {p1: blocker, p2: secondBlocker};
      }
    }
  }
  
  
  // Otherwise, just play randomly
  var rand1 = Math.floor(Math.random() * openSpots.length);
  var rand2 = Math.floor(Math.random() * (openSpots.length - 1));
  if (rand2 >= rand1) {
    rand2 += 1;
  }
  return {p1: openSpots[rand1], p2: openSpots[rand2]};
};
