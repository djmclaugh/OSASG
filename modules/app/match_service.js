module.exports = ["SocketService", "$http", function(SocketService, $http) {
  var self = this;

  self.clockOffset = 0;

  var matches = {};
  
  var ClientMatch = require("./client_match");

  SocketService.on("play", function(data) {
    matches[data.matchId].receiveMove(data.move, data.timestamp);
  });

  SocketService.on("update", function(data) {
    matches[data.matchId].update(data);
  });
  
  self.getMatch = function(matchId) {
    if (!matches[matchId]) {
      matches[matchId] = new ClientMatch(matchId, SocketService);
      SocketService.emit("api-join-match", {matchId: matchId, seat: 3});
    }
    return matches[matchId];
  };

  self.updateClockOffset = function() {
    function onSuccess(response) {
      var responseReceivedTimestamp = Date.now();
      var roudTripLenght = responseReceivedTimestamp - requestSentTimestamp;
      var roundTripTimeMiddle = (responseReceivedTimestamp + requestSentTimestamp) / 2;
      var serverTime = response.data.time;
      console.log("localTime:  " + roundTripTimeMiddle);
      console.log("serverTime: " + serverTime);
      console.log("offset: " + (roundTripTimeMiddle - serverTime));
      console.log("margingOfError: " + (roudTripLenght / 2));
      self.clockOffset = roundTripTimeMiddle - serverTime;
    }
    function onError(response) {
      console.log("Error: Could not fetch server time");
    }
    var requestSentTimestamp = Date.now();
    $http.get("/api/server_time").then(onSuccess, onError)
  }

  self.updateClockOffset();
}];
