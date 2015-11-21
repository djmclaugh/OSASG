module.exports = ["SocketService", "$http", function(SocketService, $http) {
  var self = this;

  self.activeMatches = [];
  SocketService.emit("api-active-matches");  
  
  SocketService.on("api-active-matches", function(data) {
    if ("set" in data) {
      self.activeMatches.splice.apply(self.activeMatches, [0, self.activeMatches.length].concat(data.set));
    }
    if ("add" in data) {
      self.activeMatches.push(data.add);
    }
    if ("remove" in data) {
      for (var i = 0; i < self.activeMatches.length; ++i) {
        if (self.activeMatches[i].id == data.remove.id) {
          self.activeMatches.splice(i, 1);
          break;
        }
      }
    }
    if ("update" in data) {
      for (var i = 0; i < self.activeMatches.length; ++i) {
        if (self.activeMatches[i].id == data.update.id) {
          self.activeMatches[i] = data.update;
          break;
        }
      }
    }
  });

  self.createMatch = function(gameTitle, callback) {
    function onSuccess(response) {
      if (callback) {
        callback();
      }
    }
    function onError(response) {
      if (callback) {
        callback(new Error(response.data ? response.data : "Failed to create a new match."));
      }
    }
    $http.get("/createMatch/" + gameTitle).then(onSuccess, onError);
  };
}];
