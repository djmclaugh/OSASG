module.exports = ["BotService", "SocketService", "$scope", function(BotService, SocketService, $scope) {
  var self = this;

  self.availableBots = getAvailableBots(); 

  self.getMyUsername = function() {
    return SocketService.session.username;
  };

  BotService.onChange(function() {
    self.availableBots = getAvailableBots();
  });

  function getAvailableBots() {
    var gameName = $scope.match.game.constructor.name;
    return BotService.activeBots.filter(function(bot) {
      return bot.gameList.indexOf(gameName) != -1;
    });
  }
}];
