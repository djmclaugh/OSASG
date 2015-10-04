module.exports = ["$http", function($http) {
  var self = this;

  self.activeMatches = [];

  self.fetchActiveMatches = function(callback) {
    function onSuccess(response) {
      self.activeMatches.splice.apply(self.activeMatches, [0, self.activeMatches.length].concat(response.data));
      if (callback) {
        callback(null);
      }
    }
    function onError(response) {
      if (callback) {
        callback(new Error(response.data ? response.data : "Failed to fetch active matches."));
      }
    }
    $http.get("/api/activeMatches").then(onSuccess, onError);
  };

  self.createMatch = function(gameTitle, callback) {
    function onSuccess(response) {
      self.fetchActiveMatches(callback);
    }
    function onError(response) {
      if (callback) {
        callback(new Error(response.data ? response.data : "Failed to create a new match."));
      }
    }
    $http.get("/createMatch/" + gameTitle).then(onSuccess, onError);
  };
}];
