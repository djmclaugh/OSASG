// This is a javascript for node.js implementation of a bot that makes random moves.
// This bot is able to play any game on OSASG.
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

const MY_NAME = "OSASG-RandomBot";

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
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function getConnect6Move(game) {
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
}
