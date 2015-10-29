module.exports = ["$window", "LobbyService", function($window, LobbyService) {
  var self = this;
  
  self.error = null;
  self.matches = LobbyService.activeMatches;
  
  self.createMatch = function(gameTitle) {
    LobbyService.createMatch(gameTitle, function(error) {
      self.error = error;
    });
  };

  self.openWindow = function(matchId) {
    $window.open('/match/' + matchId, matchId, 'width=800, height=500');
  };
}];
