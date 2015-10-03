var Matchup = require("./matchup");

function GameManager() {
  this.matchups = [];
  this.counter = 0;
}

var gameManagerInstance = new GameManager();

GameManager.prototype.getInstance = function() {
  return gameManagerInstance;
};

GameManager.prototype.getMatchesUserCanJoin = function(username) {
  return this.matchups.filter(function(matchup) {
    return matchup.canJoin(username);
  });
};

GameManager.prototype.getMatchesUserIsPlaying = function(username) {
  return this.matchups.filter(function(matchup) {
    return (matchup.p1 && matchup.p1 == username) ||
        (matchup.p2 && matchup.p2 == username);
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
  var matchup = new Matchup(gameTitle.toLowerCase() + "_" + this.counter, gameTitle, gameSettings, privateUsers)
  ++this.counter;
  matchup.onFinish = function() {
    var index = self.matchups.indexOf(matchup);
    self.matchups.splice(index, 1);
  };
  this.matchups.push(matchup);
  return matchup;
};

module.exports = GameManager;
