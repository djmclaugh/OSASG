// This is a class you can use if you are writting a bot in javascript.
// It handles the networking needs of the bot.
// All you have to do is write the logic to decide what move to play.
// See random_bot.js for an exampe on how to use this class.

var net = require("net");

// Helper class that handles new line delimited json TCP sockets.
var SocketAdapter = require("../modules/socket_adapter");
// Helper class that can return Game objects from a match id.
var Games = require("../modules/matches/games");

var config = require("../config.json");

// All of the message types I can send or receive.
const AUTHORIZATION = "authorization";
const JOIN_MATCH = "api-join-match";
const INVITE_PLAYER = "api-invite-player";
const UPDATE = "update";
const PLAY = "play";
const ERROR = "error-message";

function Bot(identifier, password, gameList) {
  this.identifier = identifier;
  this.password = password;
  this.gameList = gameList;
  this.socket = new net.Socket();
  this.client = new SocketAdapter(this.socket);
  this.client.isLogging = true;
  this.matches = {};
  
  this.client.on(INVITE_PLAYER, this.onInvite.bind(this));
  this.client.on(UPDATE, this.onUpdate.bind(this));
  this.client.on(PLAY, this.onPlay.bind(this));
  this.client.on(ERROR, this.onError.bind(this));
}

module.exports = Bot;

Bot.prototype.start = function() {
  var self = this;
  self.socket.connect(config.botPort, config.appURL, function() {
    self.client.emit(AUTHORIZATION, {
        identifier: self.identifier,
        password: self.password,
        gameList: self.gameList
    });
  });
};

// Subclasses should override this method to return true if and only if they are ready to join the
// specified match wih the specified settings.
Bot.prototype.wantToJoin = function(matchId, settings) {
  return false;
}

// This is called when the server wants you to join a particular match.
// You can simply ingore the message if you are not interested in that match for any reason.
// (Ex: Your bot can only handle one game at a time, your bot can't play that kind of game, or your
// bot is having trouble accesing a resource it needs to play that match.)
// If you want to join, just reply with the appropriate message within 1 second (after 1 second, the
// server will assume that you are not interested or that your connection is not stable enough to 
// play a game right now).
Bot.prototype.onInvite = function(message) {
  if (this.wantToJoin(message.matchId, message.settings)) {
    // IMPORTANT: Sending this message doesn't guaranty that I will join the match.
    // If someone else joined before the server received this, the server will ignore this message.
    // You can only know if you successfully joined a match via the "update" messages.
    this.client.emit(JOIN_MATCH, {matchId: message.matchId});
  }
};

// This is called when the server sends an update about a particular match.
// The message will contain the matchId, the names of P1 and P2, and the game state so far.
// The server will send this kind of message whenever a player joins or leaves a game.
// Usually, the game state will just be a new game. But if you are joining a game in progress
// (either reconnecting to one of your games or taking over for another player), you'll be able
// to rebuild the board from that information.
Bot.prototype.onUpdate = function(message) {
  var match = this.matches[message.matchId];
  if (!match) {
    match = {};
    match.id = message.matchId;
    match.game = Games.newGameFromId(message.matchId, message.settings);
    match.isWaitingForMoveConfirmation = false;
    this.matches[message.matchId] = match;
  }
  match.game.initFromGameData(message.gameData);
  match.p1 = message.p1;
  match.p2 = message.p2;
  this.takeAction(match);
};

// This is called whenever a move is accepted by the server (including your own moves).
// It's up to you to figure out the state of the game after this move is performed and to respond
// accordingly.
// (Ex: If it's now your turn, play. If the game is over, remove it from memory)
Bot.prototype.onPlay = function(message) {
  var match = this.matches[message.matchId];
  match.game.makeMove(message.move);
  match.isWaitingForMoveConfirmation = false;
  this.takeAction(match);
};

// This is called whenever a non-fatal error occurs, such as playing an illegal move.
// In a functioning bot, these errors should never happen.
// These errors are only provided to help with debbuging.
// Handling these errors is not recommended since if you receive them, your bot is in a weird state.
// (Your bot had to think the move was legal when it tried to play it)
Bot.prototype.onError = function(message) {
  console.log(message.error);
  this.client.close();
};

// Here, I figure out what I need to do in response to new information about a particular match.
Bot.prototype.takeAction = function(match) {
  var amP1 = match.p1 ? match.p1.identifier == this.identifier : false;
  var amP2 = match.p2 ? match.p2.identifier == this.identifier : false;
  if (!amP1 && !amP2) {
    // If I'm not even part of this match, just forget about it.
    delete this.matches[match.id];
  } else if (match.game.isOver()) {
    // If the game is over, just forget about it.
    delete this.matches[match.id];
  } else if (match.p1 == null || match.p2 == null) {
    // The match hasn't started yet so just do nothing.
  } else if (!match.isWaitingForMoveConfirmation && ((match.game.moves.length % 2 == 0 && amP1)
      || (match.game.moves.length % 2 == 1 && amP2))) {
    // If it's my turn, submit a move.
    this.client.emit(PLAY, {matchId: match.id, move: this.getMove(match)});
    // Also, don't submit any other moves until the server has accepted a new move.
    // This prevents me from playing multiple times in the same turn if I receive multiple updates
    // about an in progress game while thinking about my next move.
    match.isWaitingForMoveConfirmation = true;
  }
};

Bot.prototype.getMove = function(match) {
  throw new Error("Must be implemented by the subclass.");
}
