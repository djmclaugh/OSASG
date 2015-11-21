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
    if ("set" in data) {
      self.activeBots.splice.apply(self.activeBots, [0, self.activeBots.length].concat(data.set));  
    }
    if ("add" in data) {
      self.activeBots.push(data.add);
    }
    if ("remove" in data) {
      for (var i = 0; i < self.activeBots.length; ++i) {
        if (self.activeBots[i].id == data.remove) {
          self.activeBots.splice(i, 1);
          break;
        }
      }
    }
    changeHappened();
  });

  self.onChange = function(callback) {
    callbacks.push(callback);
  };
}];
