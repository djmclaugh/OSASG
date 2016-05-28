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

  SocketService.on("api-active-bots", function(data) {
    if (data.action == "set") {
      self.activeBots.splice.apply(self.activeBots, [0, self.activeBots.length].concat(data.bots));
    } else if (data.action == "add") {
      for (var i = 0; i < data.bots.length; ++i) {
        self.activeBots.push(data.bots[i]);
      }
    } else if (data.action == "remove") {
      for (var i = 0; i < data.bots.length; ++i) {
        var username = data.bots[i].username;
        for (var j = 0; j < self.activeBots.length; ++j) {
          if (self.activeBots[j].username == username) {
            self.activeBots.splice(j, 1);
            break;
          }
        }
      }
    }

    changeHappened();
  });

  self.onChange = function(callback) {
    callbacks.push(callback);
  };
}];
