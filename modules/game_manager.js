var Matchup = require("./matchup");
var EventDispatcher = require("./event_dispatcher");

const MATCH_ADDED = "match-added";
const MATCH_REMOVED = "match-removed";
const MATCH_UPDATED = "match-updated";


function GameManager() {
  this.matchups = [];
  this.counter = 0;
  this.dispatcher = new EventDispatcher();
}

var gameManagerInstance = new GameManager();

GameManager.prototype.getInstance = function() {
  return gameManagerInstance;
};

GameManager.prototype.onMatchAdded = function(callback) {
  return this.dispatcher.on(MATCH_ADDED, callback);
};

GameManager.prototype.onMatchRemoved = function(callback) {
  return this.dispatcher.on(MATCH_REMOVED, callback);
};

GameManager.prototype.onMatchUpdated = function(callback) {
  return this.dispatcher.on(MATCH_UPDATED, callback);
};

GameManager.prototype.removeListener = function(id) {
  this.dispatcher.removeListener(id);
};

GameManager.prototype.addMatch = function(match) {
  this.matchups.push(match);
  this.dispatcher.dispatchEvent(MATCH_ADDED, match);
};

GameManager.prototype.removeMatch = function(match) {
  var index = this.matchups.indexOf(match);
  if (index != -1) {
    this.matchups.splice(index, 1);
    this.dispatcher.dispatchEvent(MATCH_REMOVED, match);
  } else {
    throw new Error("Trying to remove non-existing match '"+ match.id + "'.");
  }
};

GameManager.prototype.getMatchesUserCanJoin = function(username) {
  return this.matchups.filter(function(matchup) {
    return matchup.canJoin(username);
  });
};

GameManager.prototype.getMatchesUserIsPlaying = function(username) {
  return this.matchups.filter(function(matchup) {
    return matchup.isCurrentlyPlaying(username);
  });
};

GameManager.prototype.getMatchupById = function(matchId) {
  for (var i = 0; i < this.matchups.length; ++i) {
    var matchup = this.matchups[i];
    if (matchup.id == matchId) {
      return matchup;
    }
  }
  return null;
};

GameManager.prototype.createNewMatchup = function(gameTitle, gameSettings, privateUsers) {
  var self = this;
  var matchupId = gameTitle.toLowerCase() + "_" + this.counter;
  var matchup = new Matchup(matchupId, gameTitle, gameSettings, privateUsers);
  this.counter += 1;
  matchup.onUpdate = function() {
    self.dispatcher.dispatchEvent(MATCH_UPDATED, matchup);
  };
  matchup.onFinish = function() {
    self.removeMatch(matchup);
  };
  this.addMatch(matchup);
  return matchup;
};

GameManager.prototype.reset = function() {
  this.counter = 0;
  this.matchups = [];
};

module.exports = GameManager;

