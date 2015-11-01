module.exports = ["SocketService", "$http", function(SocketService, $http) {
  var self = this;
  var matches = {};
  
  var ClientMatch = require("./client_match");

  SocketService.on("play", function(data) {
    matches[data.matchId].receiveMove(data.move);
  });

  SocketService.on("update", function(data) {
    matches[data.matchId].update(data);
  });
  
  self.getMatch = function(matchId) {
    if (!matches[matchId]) {
      matches[matchId] = new ClientMatch(matchId, SocketService);
      SocketService.emit("join", {matchId: matchId});
    }
    return matches[matchId];
  };
}];
