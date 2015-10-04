module.exports = ["$window", "MatchService", function($window, MatchService) {
  var self = this;
  
  self.error = null;
  self.matches = MatchService.activeMatches;
  
  MatchService.fetchActiveMatches(function(error) {
    self.error = error;
  });

  self.createMatch = function(gameTitle) {
    MatchService.createMatch(gameTitle, function(error) {
      self.error = error;
    });
  };

  self.openWindow = function(matchId) {
    $window.open('/match/' + matchId, matchId, 'width=800, height=500');
  };
}];
