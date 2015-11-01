module.exports = ["SocketService", function(SocketService) {
  var self = this;

  var callbacks = [];

  function changeHappened() {
    for (var i = 0; i < callbacks.length; ++i) {
      callbacks[i]();
    }
  }

  self.activeBots = [];
  SocketService.emit("api-active-bots");  
  
  SocketService.on("api-active-bots", function(allBots) {
    self.activeBots.splice.apply(self.activeBots, [0, self.activeBots.length].concat(allBots));
    changeHappened();
  });

  SocketService.on("api-active-bots-remove", function(bot) {
    for (var i = 0; i < self.activeBots.length; ++i) {
      if (self.activeBots[i].id == bot.id) {
        self.activeBots.splice(i, 1);
        break;
      }
    }
   changeHappened();
  });

  SocketService.on("api-active-bots-add", function(bot) {
    self.activeBots.push(bot);
    changeHappened();
  });

  self.onChange = function(callback) {
    callbacks.push(callback);
  };
}];
