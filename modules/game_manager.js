var Matchup = require("./matchup");

function GameManager() {
  this.matchups = [];
  this.counter = 0;
}

GameManager.prototype.getMatchesUserCanSpectate = function(user) {
  return this.matchups.filter(function(matchup) {
    return matchup.canSpectate(user);
  });
};

GameManager.prototype.getMatchesUserCanJoin = function(user) {
  return this.matchups.filter(function(matchup) {
    return matchup.canJoin(user);
  });
};

GameManager.prototype.getMatchesUserIsPlaying = function(user) {
  var username = user.session.username;
  return this.matchups.filter(function(matchup) {
    return (matchup.p1 && matchup.p1.session.username == username) ||
        (matchup.p2 && matchup.p2.session.username == username);
  });
};

GameManager.prototype.automatchPlayer = function(player, gameTitle) {
  // Find open game
  for (var i = 0; i < this.matchups.length; ++i) {
    var matchup = this.matchups[i];
    if (matchup.id.indexOf(gameTitle) == 0) {
      if (matchup.canJoin(player)) {
        matchup.addPlayer(player);
        return;
      }
    }
  }
  // Make new game
  var matchup = this.createNewMatchup(gameTitle, {}, null);
  matchup.addPlayer(player);
};

GameManager.prototype.createNewMatchup = function(gameTitle, gameSettings, privateUsers) {
  var self = this;
  var matchup = new Matchup(gameTitle + "_" + this.counter, gameTitle, gameSettings, privateUsers)
  ++this.counter;
  matchup.onFinish = function() {
    var index = self.matchups.indexOf(matchup);
    self.matchups.splice(index, 1);
  };
  this.matchups.push(matchup);
  return matchup;
};

module.exports = GameManager;
