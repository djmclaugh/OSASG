module.exports = ["SocketService", "$http", function(SocketService, $http) {
  var self = this;

  self.activeMatches = [];
  SocketService.emit("api-active-matches");  
  console.log("Emiting: api-active-matches");
  SocketService.on("api-active-matches", function(allMatches) {
    self.activeMatches.splice.apply(self.activeMatches, [0, self.activeMatches.length].concat(allMatches));
  });

  SocketService.on("api-active-matches-remove", function(matchData) {
    for (var i = 0; i < self.activeMatches.length; ++i) {
      if (self.activeMatches[i].id == matchData.id) {
        self.activeMatches.splice(i, 1);
        break;
      }
    }
  });

  SocketService.on("api-active-matches-add", function(matchData) {
    self.activeMatches.push(matchData);
  });
  
  SocketService.on("api-active-matches-update", function(matchData) {
    for (var i = 0; i < self.activeMatches.length; ++i) {
      if (self.activeMatches[i].id == matchData.id) {
        self.activeMatches[i] = matchData;
        break;
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
