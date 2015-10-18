// This is a javascript for node.js implementation of a bot that avoids obviously bad moves like
// not performing a winning move when it's available, but makes random moves otherwise.
// This bot is able to play tictactoe and connect6.
// Feel free to use this as a framework to make your own bot.

var net = require("net");

var Tictactoe = require("../games/tictactoe");
var Connect6 = require("../games/connect6");

// Object that contains all of the matches I am currently playing.
var matches = {};

// All of the message types I can send or receive.
const AUTHORIZATION = "authorization";
const JOIN = "join";
const UPDATE = "update";
const PLAY = "play";
const ERROR = "error-message";

const MY_NAME = "OSASG-SimpleBot";

var client = new net.Socket();
client.connect(8882, "185.28.22.25", function() {
  sendMessage({
    type: AUTHORIZATION,
    name: MY_NAME,
    passsword: "not yet implemented"
  });
});

// Utility methods for parsing newline delimited JSON
var incompleteLine = "";
var incompleteJSON = "";

client.on("data", function(data) {
  incompleteLine += data;
  var newLineIndex = incompleteLine.indexOf("\n");
  while (newLineIndex != -1) {
    onNewLine(incompleteLine.substring(0, newLineIndex + 1));
    incompleteLine = incompleteLine.substring(newLineIndex + 1);
    newLineIndex = incompleteLine.indexOf("\n");
  }
});

function onNewLine(line) {
  incompleteJSON += line;
  var jsonObject;
  try {
    jsonObject = JSON.parse(incompleteJSON);
  } catch (e) {
    jsonObjct = null;
  }
  if (jsonObject) {
    incompleteJSON = "";
    onMessage(jsonObject);
  }
}

function onMessage(message) {
  console.log("Received: ");
  console.log(message);
  if (message.type == JOIN) {
    onJoin(message);
  } else if (message.type == UPDATE) {
    onUpdate(message);
  } else if (message.type == PLAY) {
    onPlay(message);
  } else if (message.type == ERROR) {
    onError(message);
  }
}

// This is called when the server wants you to join a particular match.
// You can simply ingore the message if you are not interested in that match for any reason.
// (Ex: Your bot can only handle one game at a time, your bot can't play that kind of game, or your
// bot is having trouble accesing a resource it needs to play that match)
// If you want to join, just reply with the appropriate message within 1 second (after 1 second, the
// server will assume that you are not interested or that your connection is not stable enough to 
// play a game right now).
function onJoin(message) {
  // I only play at most 100 games at a time. (100 is completely arbitrary, but I want some kind of
  // limit.)
  var isBusy = Object.keys(matches).length >= 100;
  
  // I can only play tictactoe or connect6.
  var Game = getGameFromMatchId(message.matchId);
  var canPlay = Game == Tictactoe || Game == Connect6;
  
  if (canPlay && !isBusy) {
    // IMPORTANT: Sending this message doesn't guaranty that I will join the match.
    // If someone else joined before the server received this, the server will ignore this message.
    // You can only know if you successfully joined a match via the "update" messages.
    sendMessage({type: JOIN, matchId: message.matchId, seat: message.seat});
  }
}

// This is called when the server sends an update about a particular match.
// The message will contain the matchId, the names of P1 and P2, and the game state so far.
// The server will send this kind of message whenever a player joins or leaves a game.
// Usually, the game state will just be a new game. But if you are joining a game in progress
// (either reconnecting to one of your games or taking over for another player), you'll be able
// to rebuild the board from that information.
function onUpdate(message) {
  var Game = getGameFromMatchId(message.matchId);
  var match = matches[message.matchId];
  if (!match) {
    match = {};
    match.id = message.matchId;
    match.game = new Game();
    matches[message.matchId] = match;
  }
  match.game.initFromGameData(message.gameData);
  match.p1 = message.p1;
  match.p2 = message.p2;
  takeAction(match);
}

// This is called whenever a move is accepted by the server (including your moves).
// It's up to you to figure out the state of the game after this move is performed and to respond
// accordingly.
// (Ex: If it's now your turn, play. If the game is over, remove it from memory)
function onPlay(message) {
  var match = matches[message.matchId];
  match.game.makeMove(message.move);
  takeAction(match);
}

// This is called whenever a non-fatal error occurs, such as playing an illegal move.
// In a functioning bot, these errors should never be triggered.
// These errors are only provided to help with debbuging.
// Handling these errors is not recommended since if you receive them, your bot is in a weird state.
// (Your bot had to think the move was legal when it tried to play it)
function onError(message) {
  console.log(message.error);
  client.destroy();
}

// Here, I figure out what I need to do in response to new information about a particular match.
function takeAction(match) {
  var amP1 = match.p1 == MY_NAME;
  var amP2 = match.p2 == MY_NAME;
  if (!amP1 && !amP2) {
    // If I'm not even part of this match, just forget about it.
    delete matches[match.id];
  } else if (match.game.getStatus() != match.game.STATUS_ENUM.UNDECIDED) {
    // If the game is over, just forget about it.
    delete matches[match.id];
  } else if (match.p1 == null || match.p2 == null) {
    // The match hasn't started yet so just do nothing.
  } else if (match.game.moves.length % 2 == 0 && amP1) {
    // If it's my turn, submit a move.
    sendMessage({type: PLAY, matchId: match.id, move: getMove(match.game)});
  } else if (match.game.moves.length % 2 == 1 && amP2) {
    // If it's my turn, submit a move.
    // Note: It is possible to have your bot play against itself. So your bot can be P1 and P2 at
    // the same time.
    sendMessage({type: PLAY, matchId: match.id, move: getMove(match.game)});
  }
}

function getGameFromMatchId(matchId) {
  var gameType = matchId.substring(0, matchId.indexOf("_"));
  if (gameType == "tictactoe") {
    return Tictactoe;
  } else if (gameType == "connect6") {
    return Connect6;
  }
  return null;
}

function sendMessage(message) {
  client.write(JSON.stringify(message) + "\n");
  console.log("Sent: ");
  console.log(message);
}

////////
// ^
// | Logic to figure out what the server is saying and keeps track of the matches you're playing.
// | This is boilerplate code that you can copy if you want.
// | You might want to modify functions like onJoin depending on what games your ai can support.
//
// | Actual Game AI 
// v
////////

function getMove(game) {
  if (game instanceof Tictactoe) {
    return getTictactoeMove(game);
  } else if (game instanceof Connect6) {
    return getConnect6Move(game);
  }
  return null;
}

function getTictactoeMove(game) {
  var possibleMoves = [];
  for (var i = 0; i < 3; ++i) {
    for (var j = 0; j < 3; ++j) {
      if (game.board[i][j] == 3) {
        possibleMoves.push({x: i, y: j});
      }
    }
  }
  if (possibleMoves.length == 0) {
    return null;
  }
  
  var myColour = 1 + (game.moves.length % 2);
  var opponentColour = 3 - myColour;
  
  function isWinningMove(move, colour) {
    var counter; 
    
    // Horizontal Check
    counter = 0;
    for (var i = 0; i < 3; ++i) {
      if (game.board[i][move.y] == colour) {
        counter += 1;
      }
    }
    if (counter == 2) {
      return true;
    }
    
    // Vertical Check
    counter = 0;
    for (var i = 0; i < 3; ++i) {
      if (game.board[move.x][i] == colour) {
        counter += 1;
      }
    }
    if (counter == 2) {
      return true;
    }
    
    // x=y Check
    if (move.x == move.y) {
      counter = 0;
      for (var i = 0; i < 3; ++i) {
        if (game.board[i][i] == colour) {
          counter += 1;
        }
      }
      if (counter == 2) {
        return true;
      }
    }
    
    // x=-y Check
    if (move.x == 2 - move.y) {
      counter = 0;
      for (var i = 0; i < 3; ++i) {
        if (game.board[i][2 - i] == colour) {
          counter += 1;
        }
      }
      if (counter == 2) {
        return true;
      }
    }
    
    return false;
  }
    
  // If I can win, win.
  for (var i = 0; i < possibleMoves.length; ++i) {
    if (isWinningMove(possibleMoves[i], myColour)) {
      return possibleMoves[i];
    }
  }
  
  // If my opponent can win next turn, block him.
  for (var i = 0; i < possibleMoves.length; ++i) {
    if (isWinningMove(possibleMoves[i], opponentColour)) {
      return possibleMoves[i];
    }
  }
  
  // Otherwise, just play randomly
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function getConnect6Move(game) {
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
}
