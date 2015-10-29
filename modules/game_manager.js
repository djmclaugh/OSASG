var Matchup = require("./matchup");

function GameManager() {
  this.matchups = [];
  this.onAddCallbacks = [];
  this.onRemoveCallbacks = [];
  this.onUpdateCallbacks = [];
  this.counter = 0;
}

var gameManagerInstance = new GameManager();

GameManager.prototype.getInstance = function() {
  return gameManagerInstance;
};

function wrapCallback(callback) {
  return function(match) {
    process.nextTick(function() {
      callback(match);
    });
  };
}

GameManager.prototype.onMatchAdded = function(callback) {
  this.onAddCallbacks.push(wrapCallback(callback));
};

GameManager.prototype.onMatchRemoved = function(callback) {
  this.onRemoveCallbacks.push(wrapCallback(callback));
};

GameManager.prototype.onMatchUpdated = function(callback) {
  this.onUpdateCallbacks.push(wrapCallback(callback));
};

GameManager.prototype.addMatch = function(match) {
  this.matchups.push(match);
  for (var i = 0; i < this.onAddCallbacks.length; ++i) {
    this.onAddCallbacks[i](match);
  }
};

GameManager.prototype.removeMatch = function(match) {
  var index = this.matchups.indexOf(match);
  if (index != -1) {
    this.matchups.splice(index, 1);
    for (var i = 0; i < this.onRemoveCallbacks.length; ++i) {
      this.onRemoveCallbacks[i](match);
    }
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
  var matchup = new Matchup(gameTitle.toLowerCase() + "_" + this.counter, gameTitle, gameSettings, privateUsers);
  this.counter += 1;
  matchup.onUpdate = function() {
    for (var i = 0; i < self.onUpdateCallbacks.length; ++i) {
      self.onUpdateCallbacks[i](matchup);
    }
  };
  matchup.onFinish = function() {
    self.removeMatch(matchup);
  };
  this.addMatch(matchup);
  return matchup;
};

module.exports = GameManager;
