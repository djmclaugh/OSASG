module.exports = ["SocketService", "$http", function(SocketService, $http) {
  var self = this;

  self.activeMatches = [];
  SocketService.emit("api-active-matches");  
  
  SocketService.on("api-active-matches", function(data) {
    if (data.action == "set") {
      self.activeMatches.splice.apply(self.activeMatches, [0, self.activeMatches.length].concat(data.matches));
    } else if (data.action == "add") {
      for (var i = 0; i < data.matches.length; ++i) {
        self.activeMatches.push(data.matches[i]);
      }
    } else if (data.action == "remove") {
      for (var i = 0; i < data.matches.length; ++i) {
        var id = data.matches[i].matchId;
        for (var j = 0; j < self.activeMatches.length; ++j) {
          if (self.activeMatches[j].matchId == id) {
            self.activeMatches.splice(j, 1);
            break;
          }
        }
      }
    } else if (data.action == "update") {
      for (var i = 0; i < data.matches.length; ++i) {
        var match = data.matches[i];
        for (var j = 0; j < self.activeMatches.length; ++j) {
          if (self.activeMatches[j].matchId == match.matchId) {
            self.activeMatches[j] = match;
            break;
          }
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
    $http.get("/api/createMatch/" + gameTitle).then(onSuccess, onError);
  };
}];
